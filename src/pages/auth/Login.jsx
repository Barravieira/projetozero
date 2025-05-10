import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Stack,
  Text,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../libs/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : 'E-mail inválido',
      password: (value) =>
        value.length >= 6 ? null : 'A senha deve ter pelo menos 6 caracteres',
    },
  });

  const handleSubmit = async (values) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      navigate('/app');
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Paper withBorder shadow="md" p={30} radius="md" w={400}>
        <Title order={2} mb="md">Entrar</Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              {...form.getInputProps('email')}
              required
            />

            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              {...form.getInputProps('password')}
              required
            />

            {error && <Text color="red" size="sm">{error}</Text>}

            <Button type="submit" fullWidth>
              Entrar
            </Button>

            <Text size="sm" align="center">
              <Anchor href="/app/auth/recuperar" underline="hover">
                Esqueceu a senha?
              </Anchor>
            </Text>

            <Text size="sm" align="center">
              <Anchor href="/app/auth/cadastrar" underline="hover">
                Criar conta
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
