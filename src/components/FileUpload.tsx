import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { activityService } from '@/services/api';
import { FileAttachment } from '@/types';

interface FileUploadProps {
  activityId: string;
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  canUpload?: boolean;
  canDelete?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  activityId,
  files,
  onFilesChange,
  canUpload = false,
  canDelete = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (fileDescription) {
        formData.append('description', fileDescription);
      }

      const response = await activityService.uploadFile(activityId, formData);
      
      if (response.success && response.data) {
        setUploadSuccess('Archivo subido exitosamente');
        onFilesChange([...files, response.data]);
        setSelectedFile(null);
        setFileDescription('');
        setUploadDialogOpen(false);
      } else {
        setUploadError(response.message || 'Error al subir el archivo');
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.message || error.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      const response = await activityService.deleteFile(fileId);
      if (response.success) {
        onFilesChange(files.filter(file => file.id !== fileId));
      } else {
        setUploadError(response.message || 'Error al eliminar el archivo');
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.message || error.message || 'Error al eliminar el archivo');
    }
  };

  const handleDownload = async (file: FileAttachment) => {
    try {
      const response = await activityService.downloadFile(file.id);
      if (response) {
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.originalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      setUploadError(error.response?.data?.message || error.message || 'Error al descargar el archivo');
    }
  };

  const getFileIcon = (mimeType: string) => {
    switch (mimeType) {
      case 'application/pdf':
        return '📄';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return '🖼️';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '📝';
      case 'text/plain':
        return '📃';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h3">
          Archivos Adjuntos ({files.length})
        </Typography>
        {canUpload && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Subir Archivo
          </Button>
        )}
      </Box>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {files.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          No hay archivos adjuntos
        </Typography>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem key={file.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{getFileIcon(file.mimeType)}</span>
                    <Typography variant="body2">{file.originalName}</Typography>
                    <Chip label={formatFileSize(file.size)} size="small" variant="outlined" />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Subido el {new Date(file.uploadedAt).toLocaleDateString()}
                    </Typography>
                    {file.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {file.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDownload(file)} title="Descargar">
                  <DownloadIcon />
                </IconButton>
                {canDelete && (
                  <IconButton edge="end" onClick={() => handleDelete(file.id)} title="Eliminar" color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Diálogo de carga */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Subir Archivo
          <IconButton
            aria-label="close"
            onClick={() => setUploadDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box {...getRootProps()} sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper'
          }}>
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF, imágenes (JPEG, PNG), Word o archivos de texto. Máximo 10MB.
            </Typography>
          </Box>

          {selectedFile && (
            <Box mt={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Archivo seleccionado: {selectedFile.name}
              </Alert>
              <TextField
                fullWidth
                label="Descripción (opcional)"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                multiline
                rows={2}
                placeholder="Describe brevemente el contenido del archivo..."
              />
            </Box>
          )}

          {uploadSuccess && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setUploadSuccess(null)}>
              {uploadSuccess}
            </Alert>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload;