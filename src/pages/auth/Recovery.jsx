import { useState } from 'react';
import {
  TextInput,
  Button,
  Paper,
  Title,
  Stack,
  Text,
  Anchor,
} from '@mantine/core';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../libs/firebase';

export default function Recovery() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError('Erro ao enviar e-mail. Verifique o endereço.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Paper withBorder shadow="md" p={30} radius="md" w={400}>
        <Title order={2} mb="md">Recuperar senha</Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              required
            />

            {success && <Text color="green" size="sm">E-mail enviado com sucesso!</Text>}
            {error && <Text color="red" size="sm">{error}</Text>}

            <Button type="submit" fullWidth>
              Enviar link de recuperação
            </Button>

            <Text size="sm" align="center">
              <Anchor href="/app/auth/entrar" underline="hover">Voltar para login</Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
