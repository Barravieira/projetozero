import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../libs/firebase';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Text,
  Stack,
  Anchor,
  Title,
} from '@mantine/core';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/app');
    } catch (err) {
      setError('Erro ao criar conta. Verifique os dados.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Paper withBorder shadow="md" p={30} radius="md" w={400}>
        <Title order={2} mb="md">Criar conta</Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="E-mail"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              required
            />

            <PasswordInput
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              required
            />

            <PasswordInput
              label="Confirmar senha"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.currentTarget.value)}
              required
            />

            {error && <Text color="red" size="sm">{error}</Text>}

            <Button type="submit" fullWidth>Criar conta</Button>

            <Text size="sm" align="center">
              Já tem conta?{' '}
              <Anchor href="/app/auth/login" underline="hover">Entrar</Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
