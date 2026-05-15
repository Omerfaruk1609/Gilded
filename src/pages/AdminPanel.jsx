import React from 'react';
import { Box, Typography } from '@mui/material';

function AdminPanel() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Admin Paneli</Typography>
      <Typography>Yönetimsel işlemler buradan gerçekleştirilir.</Typography>
    </Box>
  );
}

export default AdminPanel;
