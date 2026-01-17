// src/components/ImageUploader.tsx
import React from 'react';
import { Box, Button, Flex, Icon, Text } from '@gravity-ui/uikit';
import { TrashBin, Plus } from '@gravity-ui/icons';

interface ImageUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const ImageUploader = ({ files, onFilesChange }: ImageUploaderProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesChange([...files, ...Array.from(event.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Text variant="body-2" color="secondary" mb={2}>Изображения</Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
        {files.map((file, index) => (
          <Box key={index} style={{ position: 'relative', border: '1px solid var(--g-color-line-generic)', borderRadius: '8px', overflow: 'hidden' }}>
            <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
            <Button onClick={() => handleRemoveFile(index)} view="flat-danger" style={{ position: 'absolute', top: '4px', right: '4px' }}>
              <Icon data={TrashBin} />
            </Button>
          </Box>
        ))}
        <label>
          <Flex
            justify="center"
            align="center"
            style={{
              width: '100%',
              height: '120px',
              border: '2px dashed var(--g-color-line-generic)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Icon data={Plus} size={24} />
          </Flex>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
      </div>
    </Box>
  );
};
