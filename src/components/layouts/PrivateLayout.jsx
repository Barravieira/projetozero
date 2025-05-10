import { AppShell, Button, Stack, Text, Box, NavLink, Group } from '@mantine/core';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function PrivateLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/app/auth/entrar');
  };

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: false },
      }}
    >
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Box>
            <Text fw={700} fz="lg" mb="lg">Meu App</Text>
            <NavLink label="Dashboard" onClick={() => navigate('/app')} />
            {/* Adicione outros links aqui */}
          </Box>
          <Group grow>
            <Button variant="light" onClick={handleLogout}>
              Sair
            </Button>
          </Group>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
