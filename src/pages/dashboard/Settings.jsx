import { useState } from 'react';
import {
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Notification,
} from '@mantine/core';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth } from '../../libs/firebase';
import { IconCheck, IconX } from '@tabler/icons-react';

export default function Settings() {
  const user = auth.currentUser;
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (email !== user.email) {
        await updateEmail(user, email);
        setSuccess('Email atualizado com sucesso!');
      }

      if (password) {
        await updatePassword(user, password);
        setSuccess((prev) => prev + '\nSenha atualizada com sucesso!');
        setPassword('');
      }
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Por segurança, você precisa sair e entrar novamente para alterar suas credenciais.');
      } else {
        setError('Erro ao atualizar as informações. Verifique os dados.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <Paper withBorder shadow="md" p="xl" w={400}>
        <Title order={2} mb="md">
          Configurações da Conta
        </Title>

        <form onSubmit={handleUpdate}>
          <Stack>
            <TextInput
              label="Novo e-mail"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />

            <PasswordInput
              label="Nova senha"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            <Button type="submit" fullWidth>
              Salvar alterações
            </Button>

            {success && (
              <Notification color="green" icon={<IconCheck size={16} />} withCloseButton>
                {success}
              </Notification>
            )}
            {error && (
              <Notification color="red" icon={<IconX size={16} />} withCloseButton>
                {error}
              </Notification>
            )}
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
