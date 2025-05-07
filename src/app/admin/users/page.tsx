'use client';

import { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  TextField, 
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/format';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export default function UserManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading2, setLoading2] = useState(false);
  
  // 編集関連
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newName, setNewName] = useState('');
  
  // 削除関連
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // メッセージ表示
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // 管理者でない場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  // ユーザー一覧取得
  const fetchUsers = async () => {
    setLoading2(true);
    try {
      const searchQuery = searchText ? `&search=${encodeURIComponent(searchText)}` : '';
      const res = await fetch(
        `/api/users?page=${page + 1}&limit=${pageSize}${searchQuery}`
      );
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        showSnackbar('ユーザー情報の取得に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showSnackbar('ユーザー情報の取得中にエラーが発生しました', 'error');
    } finally {
      setLoading2(false);
    }
  };

  // 初期読み込みとページ変更時に取得
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [page, pageSize, user?.role]);

  // 検索実行
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // 編集ダイアログ関連
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewName(user.name || '');
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setNewRole(event.target.value as 'USER' | 'ADMIN');
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  };

  // 削除ダイアログ関連
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // DataGridのカラム定義
  const columns: GridColDef[] = [
    { field: 'name', headerName: '名前', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'メールアドレス', flex: 1, minWidth: 200 },
    { 
      field: 'role', 
      headerName: '役割', 
      width: 100,
      renderCell: (params) => (
        <Box sx={{ 
          bgcolor: params.row.role === 'ADMIN' ? 'primary.main' : 'text.secondary',
          color: 'white',
          py: 0.5,
          px: 1.5,
          borderRadius: 1,
        }}>
          {params.row.role === 'ADMIN' ? '管理者' : 'ユーザー'}
        </Box>
      )
    },
    { 
      field: 'createdAt', 
      headerName: '登録日時', 
      width: 180,
      valueFormatter: (params) => {
        return formatDate(params.value as string);
      },
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => handleEditClick(params.row)}
            disabled={user?.id === params.row.id}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDeleteClick(params.row)}
            disabled={user?.id === params.row.id}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleUserUpdate = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
          name: newName,
        }),
      });
      
      if (res.ok) {
        showSnackbar('ユーザー情報を更新しました', 'success');
        fetchUsers();
      } else {
        const data = await res.json();
        showSnackbar(data.error || 'ユーザー情報の更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      showSnackbar('ユーザー情報の更新中にエラーが発生しました', 'error');
    } finally {
      handleEditDialogClose();
    }
  };

  const handleUserDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        showSnackbar('ユーザーを削除しました', 'success');
        fetchUsers();
      } else {
        const data = await res.json();
        showSnackbar(data.error || 'ユーザーの削除に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      showSnackbar('ユーザーの削除中にエラーが発生しました', 'error');
    } finally {
      handleDeleteDialogClose();
    }
  };

  // スナックバー表示
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading || user?.role !== 'ADMIN') {
    return <Box sx={{ p: 3 }}>読み込み中...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        ユーザー管理
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="名前またはメールアドレスで検索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flexGrow: 1, mr: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={handleSearch}>
            検索
          </Button>
        </Box>
        
        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            pagination
            rowCount={totalUsers}
            pageSizeOptions={[5, 10, 25]}
            paginationModel={{ page, pageSize }}
            paginationMode="server"
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            loading={loading2}
            disableRowSelectionOnClick
            localeText={{
              noRowsLabel: 'データがありません',
            }}
          />
        </div>
      </Paper>
      
      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>ユーザー情報の編集</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedUser?.email}
          </DialogContentText>
          
          <TextField
            label="名前"
            fullWidth
            value={newName}
            onChange={handleNameChange}
            margin="dense"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-select-label">役割</InputLabel>
            <Select
              labelId="role-select-label"
              value={newRole}
              onChange={handleRoleChange}
              label="役割"
            >
              <MenuItem value="USER">ユーザー</MenuItem>
              <MenuItem value="ADMIN">管理者</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>キャンセル</Button>
          <Button onClick={handleUserUpdate} variant="contained">
            更新
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>ユーザーの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {userToDelete?.name || userToDelete?.email} を削除してもよろしいですか？
            この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>キャンセル</Button>
          <Button onClick={handleUserDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* スナックバー */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 