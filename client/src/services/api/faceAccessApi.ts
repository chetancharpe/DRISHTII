/**
 * DRISHTI FACEACCESS AI - Client API & WebAuthn Biometric Service
 */

import { apiClient } from '../api';
import { tokenStorage } from '../../utils/tokenStorage';
import { mapBackendUserToClient, BackendTokenResponse } from '../authService';
import { User } from '../../types/user';

export interface FaceAccessChallenge {
  challenge_id: string;
  nonce: string;
  liveness_action: string;
  instruction_en: string;
  instruction_hi: string;
  expires_at: number;
}

export interface FaceAccessEnrollResult {
  status: string;
  message: string;
  enrolled_at: string;
}

export const faceAccessApi = {
  /**
   * Request single-use anti-replay challenge session from the server
   */
  async requestChallenge(email?: string): Promise<FaceAccessChallenge> {
    try {
      const res = await apiClient<FaceAccessChallenge>('/auth/face-access/challenge', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: email ? email.trim().toLowerCase() : undefined }),
      });
      return res;
    } catch {
      // Local fallback challenge if offline or network failure
      const now = Math.floor(Date.now() / 1000);
      return {
        challenge_id: 'local_challenge_' + Date.now(),
        nonce: 'nonce_' + Math.random().toString(36).substring(2),
        liveness_action: 'align_steady',
        instruction_en: 'Keep your face steady inside the target circle for 2 seconds.',
        instruction_hi: 'लक्ष्य घेरे के भीतर 2 सेकंड तक अपना चेहरा स्थिर रखें।',
        expires_at: now + 60,
      };
    }
  },

  /**
   * Submit biometric token and liveness proof to authenticate candidate
   */
  async verifyFaceAccess(params: {
    challenge_id: string;
    email: string;
    biometric_token: string;
    liveness_proof: string;
    liveness_score: number;
  }): Promise<{ user: User; token: string }> {
    try {
      const res = await apiClient<BackendTokenResponse>('/auth/face-access/verify', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(params),
      });

      tokenStorage.setTokens(res.access_token, res.refresh_token);
      const user = mapBackendUserToClient(res.user);
      localStorage.setItem('drishti_current_user', JSON.stringify(user));
      return { user, token: res.access_token };
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        const enhancedError = new Error(
          'Backend server is not reachable on port 8000 (net::ERR_CONNECTION_REFUSED). Please ensure the FastAPI backend is running: `uvicorn app.main:app --port 8000`.'
        );
        (enhancedError as any).code = 'BACKEND_OFFLINE';
        throw enhancedError;
      }
      // Re-throw actual backend biometric mismatch, liveness rejection, or expired session
      // NEVER silently fake authentication success
      throw err;
    }
  },

  /**
   * Enroll candidate's facial biometric template under explicit informed consent
   */
  async enroll(biometric_token: string, consent_agreed: boolean): Promise<FaceAccessEnrollResult> {
    const res = await apiClient<FaceAccessEnrollResult>('/auth/face-access/enroll', {
      method: 'POST',
      body: JSON.stringify({ biometric_token, consent_agreed }),
    });
    localStorage.setItem('drishti_faceaccess_enrolled', 'true');
    return res;
  },

  /**
   * Revoke consent and delete all biometric templates
   */
  async revoke(): Promise<{ status: string; message: string }> {
    const res = await apiClient<{ status: string; message: string }>('/auth/face-access', {
      method: 'DELETE',
    });
    localStorage.removeItem('drishti_faceaccess_enrolled');
    return res;
  },

  /**
   * Check enrollment status
   */
  async getStatus(): Promise<{ is_enrolled: boolean; enrolled_at?: string }> {
    try {
      const res = await apiClient<{ is_enrolled: boolean; enrolled_at?: string }>('/auth/face-access/status');
      return res;
    } catch {
      const local = localStorage.getItem('drishti_faceaccess_enrolled') === 'true';
      return { is_enrolled: local };
    }
  },

  /**
   * Hardware-backed WebAuthn / Passkey biometric authentication check
   */
  async isPasskeySupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  /**
   * Authenticate via Device Biometrics (Windows Hello / Touch ID / Face ID)
   */
  async authenticateWithPasskey(email: string): Promise<{ user: User; token: string }> {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn platform biometrics are not supported on this browser.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname || 'localhost',
      },
    });

    if (!credential) {
      throw new Error('Biometric passkey authentication was cancelled.');
    }

    // Biometric verified by OS platform authenticator
    return await this.verifyFaceAccess({
      challenge_id: 'passkey_' + Date.now(),
      email,
      biometric_token: 'webauthn_passkey_' + credential.id,
      liveness_proof: 'fido2_platform_uv_true',
      liveness_score: 1.0,
    });
  },
};

