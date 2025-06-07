'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  Stack,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  RadioGroup,
  Radio,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// フィールドタイプの定義
export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  TEXTAREA = 'TEXTAREA',
  RADIO = 'RADIO',
  FILE = 'FILE'
}

// フィールドタイプの表示名
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.TEXT]: 'テキスト入力',
  [FieldType.NUMBER]: '数値入力',
  [FieldType.TEXTAREA]: 'テキストエリア',
  [FieldType.RADIO]: 'ラジオボタン',
  [FieldType.FILE]: 'ファイルアップロード'
};

// フォームフィールドの型定義
export interface FormField {
  id: string;
  label: string;
  fieldType: FieldType;
  options?: string[];
  isRequired: boolean;
  order: number;
}

// フォームビルダーのプロパティ
interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  disabled?: boolean;
}

// フィールド編集ダイアログのプロパティ
interface FieldEditDialogProps {
  open: boolean;
  field: FormField | null;
  onClose: () => void;
  onSave: (field: FormField) => void;
  existingFieldIds: string[];
}

// ドラッグ中のアイテム情報
interface DragItem {
  index: number;
  field: FormField;
}

// フィールド編集ダイアログコンポーネント
function FieldEditDialog({ open, field, onClose, onSave, existingFieldIds }: FieldEditDialogProps) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<{ label?: string; options?: string }>({});

  React.useEffect(() => {
    if (field) {
      setEditingField({ ...field });
      setOptions(field.options || []);
    } else {
      // 新規作成時のデフォルト値
      setEditingField({
        id: `field_${Date.now()}`,
        label: '',
        fieldType: FieldType.TEXT,
        isRequired: false,
        order: 0
      });
      setOptions([]);
    }
    setErrors({});
    setNewOption('');
  }, [field]);

  const handleSave = () => {
    if (!editingField) return;

    const newErrors: { label?: string; options?: string } = {};

    // バリデーション
    if (!editingField.label.trim()) {
      newErrors.label = 'ラベルは必須です';
    }

    if (editingField.fieldType === FieldType.RADIO && options.length < 2) {
      newErrors.options = 'ラジオボタンには少なくとも2つの選択肢が必要です';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...editingField,
      options: editingField.fieldType === FieldType.RADIO ? options : undefined
    });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
      setErrors({ ...errors, options: undefined });
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  if (!editingField) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {field ? 'フィールドを編集' : '新しいフィールドを追加'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="ラベル"
            fullWidth
            value={editingField.label}
            onChange={(e) => {
              setEditingField({ ...editingField, label: e.target.value });
              if (errors.label) setErrors({ ...errors, label: undefined });
            }}
            error={!!errors.label}
            helperText={errors.label}
            required
            sx={{ mb: 3 }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel>フィールドタイプ</FormLabel>
            <Select
              value={editingField.fieldType}
              onChange={(e) => {
                setEditingField({ ...editingField, fieldType: e.target.value as FieldType });
                if (e.target.value !== FieldType.RADIO) {
                  setOptions([]);
                  setErrors({ ...errors, options: undefined });
                }
              }}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([type, label]) => (
                <MenuItem key={type} value={type}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {editingField.fieldType === FieldType.RADIO && (
            <Box sx={{ mb: 3 }}>
              <FormLabel required>選択肢</FormLabel>
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="選択肢を追加"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    error={!!errors.options}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    追加
                  </Button>
                </Stack>
                {errors.options && (
                  <FormHelperText error>{errors.options}</FormHelperText>
                )}
                <List dense>
                  {options.map((option, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={option} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={editingField.isRequired}
                onChange={(e) => setEditingField({ ...editingField, isRequired: e.target.checked })}
              />
            }
            label="必須項目にする"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// プレビューダイアログコンポーネント
function PreviewDialog({ open, onClose, fields }: { open: boolean; onClose: () => void; fields: FormField[] }) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">フォームプレビュー</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          これは作成したフォームのプレビューです。実際の回答画面での表示を確認できます。
        </Alert>
        {fields.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            フィールドが追加されていません
          </Typography>
        ) : (
          fields.map((field) => (
            <Box key={field.id} sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <FormLabel required={field.isRequired} sx={{ mb: 1 }}>
                  {field.label}
                </FormLabel>
                {field.fieldType === FieldType.TEXT && (
                  <TextField
                    fullWidth
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.isRequired}
                  />
                )}
                {field.fieldType === FieldType.NUMBER && (
                  <TextField
                    type="number"
                    fullWidth
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.isRequired}
                  />
                )}
                {field.fieldType === FieldType.TEXTAREA && (
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.isRequired}
                  />
                )}
                {field.fieldType === FieldType.RADIO && field.options && (
                  <RadioGroup
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  >
                    {field.options.map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                )}
                {field.fieldType === FieldType.FILE && (
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      ファイルアップロードフィールド
                    </Typography>
                  </Paper>
                )}
              </FormControl>
            </Box>
          ))
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function FormBuilder({ fields, onChange, disabled = false }: FormBuilderProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, index: number, field: FormField) => {
    if (disabled) return;
    setDraggedItem({ index, field });
    e.dataTransfer.effectAllowed = 'move';
  }, [disabled]);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [disabled]);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (disabled || !draggedItem) return;
    e.preventDefault();

    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) return;

    const newFields = [...fields];
    const [removed] = newFields.splice(dragIndex, 1);
    newFields.splice(dropIndex, 0, removed);

    // order を更新
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));

    onChange(updatedFields);
    setDraggedItem(null);
  }, [disabled, draggedItem, fields, onChange]);

  // フィールド追加
  const handleAddField = useCallback(() => {
    setEditingField(null);
    setShowEditDialog(true);
  }, []);

  // フィールド編集
  const handleEditField = useCallback((field: FormField) => {
    setEditingField(field);
    setShowEditDialog(true);
  }, []);

  // フィールド削除
  const handleDeleteField = useCallback((fieldId: string) => {
    const newFields = fields.filter(f => f.id !== fieldId);
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    onChange(updatedFields);
  }, [fields, onChange]);

  // フィールド保存
  const handleSaveField = useCallback((field: FormField) => {
    if (editingField) {
      // 編集の場合
      const updatedFields = fields.map(f => f.id === field.id ? field : f);
      onChange(updatedFields);
    } else {
      // 新規追加の場合
      const newField = { ...field, order: fields.length };
      onChange([...fields, newField]);
    }
    setShowEditDialog(false);
    setEditingField(null);
  }, [editingField, fields, onChange]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">回答フォームの設定</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
              disabled={fields.length === 0}
            >
              プレビュー
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddField}
              disabled={disabled}
            >
              フィールドを追加
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {fields.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'action.hover',
              border: '2px dashed',
              borderColor: 'divider'
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              フォームフィールドがありません
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              「フィールドを追加」ボタンをクリックして、回答フォームの項目を作成してください
            </Typography>
          </Paper>
        ) : (
          <List>
            {fields.map((field, index) => (
              <Paper
                key={field.id}
                elevation={1}
                sx={{
                  mb: 1,
                  p: 2,
                  cursor: disabled ? 'default' : 'move',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': disabled ? {} : { backgroundColor: 'action.hover' }
                }}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, index, field)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DragIcon color="action" />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2">{field.label}</Typography>
                      {field.isRequired && (
                        <Chip label="必須" size="small" color="error" variant="outlined" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={FIELD_TYPE_LABELS[field.fieldType]}
                        size="small"
                        variant="outlined"
                      />
                      {field.fieldType === FieldType.RADIO && field.options && (
                        <Typography variant="caption" color="text.secondary">
                          選択肢: {field.options.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditField(field)}
                      disabled={disabled}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteField(field.id)}
                      disabled={disabled}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </List>
        )}

        {/* フィールド編集ダイアログ */}
        <FieldEditDialog
          open={showEditDialog}
          field={editingField}
          onClose={() => {
            setShowEditDialog(false);
            setEditingField(null);
          }}
          onSave={handleSaveField}
          existingFieldIds={fields.map(f => f.id)}
        />

        {/* プレビューダイアログ */}
        <PreviewDialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          fields={fields}
        />
      </CardContent>
    </Card>
  );
} 