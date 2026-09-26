import React from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const QuestionForm: React.FC = () => {
  return (
    <Card title="Item Authoring & ClearSpeak Formatting" subtitle="Define prompt, auditory description, and distractor options">
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Input label="Question Stem" placeholder="Enter clear, unambiguous question text" required />
        <Input label="ClearSpeak Audio Description" placeholder="Spoken math or diagram transcript" />
        <Input label="Subject Area" placeholder="Physics / Math / Reasoning" required />
        <Button variant="primary" type="submit">
          Save Question Item (Placeholder)
        </Button>
      </form>
    </Card>
  );
};
