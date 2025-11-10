import { AppShell, Button, Stack, Text, Box, NavLink, Group, Burger } from '@mantine/core';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDisclosure } from '@mantine/hooks';

export default function PrivateLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const handleLogout = async () => {
    await logout();
    navigate('/app/auth/entrar');
  };

  return (
    <AppShell
      padding={{ base: 'sm', sm: 'md' }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      header={{
        height: 60,
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Text fw={700} fz="lg">
            {import.meta.env.VITE_APP_NAME}
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Box>
            <NavLink 
              label="Home" 
              onClick={() => {
                navigate('/app');
                toggleMobile();
              }} 
            />
            <NavLink 
              label="Produtos" 
              onClick={() => {
                navigate('/app/produtos');
                toggleMobile();
              }} 
            />
            <NavLink 
              label="Pacientes" 
              onClick={() => {
                navigate('/app/pacientes');
                toggleMobile();
              }} 
            />
            <NavLink 
              label="Configurações" 
              onClick={() => {
                navigate('/app/configuracoes');
                toggleMobile();
              }} 
            />
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
