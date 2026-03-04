-- Add synonyms and antonyms columns to naesin_vocabulary
ALTER TABLE naesin_vocabulary ADD COLUMN synonyms TEXT;
ALTER TABLE naesin_vocabulary ADD COLUMN antonyms TEXT;
