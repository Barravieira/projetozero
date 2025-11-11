import {
  Button,
  TextInput,
  Stack,
  Group,
  Loader,
  Paper,
  Title,
  ActionIcon,
  NumberInput,
  Text,
} from '@mantine/core';
import { IconList } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../libs/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

export default function PatientForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: patientId } = useParams();
  const stateData = location.state;

  const [initialData, setInitialData] = useState(stateData || null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!stateData && !!patientId);

  const form = useForm({
    initialValues: {
      name: '',
      phone: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      responsibleName: '',
      schoolName: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Nome é obrigatório'),
      phone: (value) => (value.trim().length > 0 ? null : 'Telefone é obrigatório'),
      birthDay: (value) => {
        if (!value) return null; // opcional
        const day = parseInt(value);
        return (day >= 1 && day <= 31) ? null : 'Dia inválido (1-31)';
      },
      birthMonth: (value) => {
        if (!value) return null; // opcional
        const month = parseInt(value);
        return (month >= 1 && month <= 12) ? null : 'Mês inválido (1-12)';
      },
      birthYear: (value) => {
        if (!value) return null; // opcional
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        return (year >= 1900 && year <= currentYear) ? null : `Ano inválido (1900-${currentYear})`;
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      let day = '';
      let month = '';
      let year = '';
      
      if (initialData.birthDate?.toDate) {
        const date = initialData.birthDate.toDate();
        day = date.getDate().toString();
        month = (date.getMonth() + 1).toString();
        year = date.getFullYear().toString();
      }
      
      form.setValues({
        name: initialData.name || '',
        phone: initialData.phone || '',
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        responsibleName: initialData.responsibleName || '',
        schoolName: initialData.schoolName || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    if (!stateData && patientId) {
      const fetchPatient = async () => {
        try {
          const refDoc = doc(db, 'patients', patientId);
          const snap = await getDoc(refDoc);
          if (snap.exists()) {
            const data = snap.data();
            setInitialData({ id: snap.id, ...data });
          } else {
            alert('Paciente não encontrado.');
            navigate('/app/pacientes');
          }
        } catch (err) {
          alert('Erro ao carregar paciente: ' + err.message);
          navigate('/app/pacientes');
        } finally {
          setFetching(false);
        }
      };

      fetchPatient();
    }
  }, [stateData, patientId, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      let birthDate = null;
      if (values.birthDay && values.birthMonth && values.birthYear) {
        const day = parseInt(values.birthDay);
        const month = parseInt(values.birthMonth) - 1; // JavaScript months are 0-indexed
        const year = parseInt(values.birthYear);
        
        // Validate date
        const date = new Date(year, month, day);
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          birthDate = Timestamp.fromDate(date);
        } else {
          notifications.show({
            title: 'Erro',
            message: 'Data de nascimento inválida. Verifique os valores.',
            color: 'red',
          });
          setLoading(false);
          return;
        }
      }

      const patientData = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        birthDate,
        responsibleName: values.responsibleName.trim() || null,
        schoolName: values.schoolName.trim() || null,
        updatedAt: Timestamp.now(),
      };

      if (patientId) {
        const refDoc = doc(db, 'patients', patientId);
        await updateDoc(refDoc, patientData);
        notifications.show({
          title: 'Sucesso!',
          message: 'Paciente atualizado com sucesso.',
          color: 'green',
        });
        navigate('/app/pacientes/lista');
      } else {
        await addDoc(collection(db, 'patients'), {
          ...patientData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
        notifications.show({
          title: 'Sucesso!',
          message: 'Paciente cadastrado com sucesso.',
          color: 'green',
        });
        form.reset();
      }
    } catch (err) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar paciente: ' + err.message,
        color: 'red',
      });
    }

    setLoading(false);
  };

  if (fetching) {
    return <Loader />;
  }

  const isEditMode = !!patientId;

  return (
    <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" maw={{ base: '100%', sm: 600 }} mx="auto" w="100%">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>
            {isEditMode ? 'Editar Paciente' : 'Cadastrar Paciente'}
          </Title>
          {!isEditMode && (
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => navigate('/app/pacientes/lista')}
              title="Ver lista de pacientes"
            >
              <IconList size={20} />
            </ActionIcon>
          )}
        </Group>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome"
              placeholder="Nome completo do paciente"
              required
              size="md"
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Telefone"
              placeholder="(00) 00000-0000"
              required
              size="md"
              {...form.getInputProps('phone')}
            />

            <div>
              <Text size="sm" fw={500} mb={4}>
                Data de Nascimento (opcional)
              </Text>
              <Group gap="xs" grow>
                <NumberInput
                  placeholder="Dia"
                  min={1}
                  max={31}
                  size="md"
                  hideControls
                  {...form.getInputProps('birthDay')}
                />
                <NumberInput
                  placeholder="Mês"
                  min={1}
                  max={12}
                  size="md"
                  hideControls
                  {...form.getInputProps('birthMonth')}
                />
                <NumberInput
                  placeholder="Ano"
                  min={1900}
                  max={new Date().getFullYear()}
                  size="md"
                  hideControls
                  {...form.getInputProps('birthYear')}
                />
              </Group>
            </div>

            <TextInput
              label="Nome do Responsável"
              placeholder="Nome do responsável (opcional)"
              size="md"
              {...form.getInputProps('responsibleName')}
            />

            <TextInput
              label="Nome da Escola"
              placeholder="Nome da escola (opcional)"
              size="md"
              {...form.getInputProps('schoolName')}
            />

            <Group justify="flex-end" gap="sm" mt="md">
              {isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/app/pacientes/lista')}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" loading={loading} size="md">
                {isEditMode ? 'Atualizar' : 'Salvar Paciente'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}

