import { useState, useEffect } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Switch,
  Card,
  ActionIcon,
  Modal,
  NumberInput,
  Loader,
  Badge,
  Select,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconPlus, IconTrash, IconEdit, IconClock, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../libs/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export default function AvailableHours() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableHours, setAvailableHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingHour, setEditingHour] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm({
    initialValues: {
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '18:00',
      interval: 30,
      enabled: true,
    },
    validate: {
      startTime: (value) => (value ? null : 'Horário de início é obrigatório'),
      endTime: (value) => (value ? null : 'Horário de fim é obrigatório'),
      interval: (value) => (value > 0 ? null : 'Intervalo deve ser maior que 0'),
    },
  });

  useEffect(() => {
    if (user) {
      fetchAvailableHours();
    }
  }, [user]);

  const fetchAvailableHours = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const ref = collection(db, 'availableHours');
      const q = query(ref, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const hours = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar por dia da semana
      hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setAvailableHours(hours);
    } catch (err) {
      console.error('Erro ao buscar horários disponíveis:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao buscar horários disponíveis',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (!user) return;

    try {
      const data = {
        userId: user.uid,
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        interval: values.interval,
        enabled: values.enabled,
        createdAt: new Date(),
      };

      if (editingHour) {
        await updateDoc(doc(db, 'availableHours', editingHour.id), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Horário atualizado com sucesso!',
          color: 'green',
        });
      } else {
        await addDoc(collection(db, 'availableHours'), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Horário adicionado com sucesso!',
          color: 'green',
        });
      }

      form.reset();
      setEditingHour(null);
      closeModal();
      fetchAvailableHours();
    } catch (err) {
      console.error('Erro ao salvar horário:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar horário',
        color: 'red',
      });
    }
  };

  const handleEdit = (hour) => {
    setEditingHour(hour);
    form.setValues({
      dayOfWeek: hour.dayOfWeek,
      startTime: hour.startTime,
      endTime: hour.endTime,
      interval: hour.interval,
      enabled: hour.enabled,
    });
    openModal();
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) return;

    try {
      await deleteDoc(doc(db, 'availableHours', id));
      notifications.show({
        title: 'Sucesso',
        message: 'Horário excluído com sucesso!',
        color: 'green',
      });
      fetchAvailableHours();
    } catch (err) {
      console.error('Erro ao excluir horário:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir horário',
        color: 'red',
      });
    }
  };

  const handleToggleEnabled = async (hour) => {
    try {
      await updateDoc(doc(db, 'availableHours', hour.id), {
        enabled: !hour.enabled,
      });
      notifications.show({
        title: 'Sucesso',
        message: `Horário ${!hour.enabled ? 'ativado' : 'desativado'} com sucesso!`,
        color: 'green',
      });
      fetchAvailableHours();
    } catch (err) {
      console.error('Erro ao atualizar horário:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao atualizar horário',
        color: 'red',
      });
    }
  };

  const getDayName = (dayOfWeek) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || '';
  };

  const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    const start = dayjs(startTime, 'HH:mm');
    const end = dayjs(endTime, 'HH:mm');
    let current = start;

    while (current.isBefore(end) || current.isSame(end)) {
      slots.push(current.format('HH:mm'));
      current = current.add(interval, 'minute');
    }

    return slots;
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader />
        <Text c="dimmed">Carregando...</Text>
      </Stack>
    );
  }

  if (!user) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Text c="dimmed">Usuário não autenticado</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Group gap="xs">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/app/agenda')}
          >
            Voltar para Agenda
          </Button>
          <Title order={2}>Horários Disponíveis</Title>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
          Adicionar Horário
        </Button>
      </Group>

      {availableHours.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <IconClock size={48} stroke={1.5} style={{ margin: '0 auto', marginBottom: 16 }} />
          <Text c="dimmed" size="lg">
            Nenhum horário configurado
          </Text>
          <Text c="dimmed" size="sm" mt="xs">
            Adicione horários disponíveis para agendamento de consultas
          </Text>
        </Paper>
      ) : (
        <Stack gap="md">
          {availableHours.map((hour) => {
            const slots = generateTimeSlots(hour.startTime, hour.endTime, hour.interval);
            return (
              <Card key={hour.id} withBorder padding="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <Text fw={600} size="lg">
                        {getDayName(hour.dayOfWeek)}
                      </Text>
                      <Badge color={hour.enabled ? 'green' : 'gray'} variant="light">
                        {hour.enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" mb="xs">
                      {hour.startTime} - {hour.endTime} (Intervalo: {hour.interval} min)
                    </Text>
                    <Text size="xs" c="dimmed">
                      {slots.length} horários disponíveis
                    </Text>
                  </div>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleEdit(hour)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(hour.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <Switch
                      checked={hour.enabled}
                      onChange={() => handleToggleEnabled(hour)}
                      label="Ativo"
                    />
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          form.reset();
          setEditingHour(null);
        }}
        title={editingHour ? 'Editar Horário' : 'Adicionar Horário'}
        size={isMobile ? '100%' : 'md'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Dia da Semana"
              data={DAYS_OF_WEEK.map((d) => ({ value: d.value, label: d.label }))}
              {...form.getInputProps('dayOfWeek')}
              required
            />
            <TimeInput
              label="Horário de Início"
              {...form.getInputProps('startTime')}
              required
            />
            <TimeInput
              label="Horário de Fim"
              {...form.getInputProps('endTime')}
              required
            />
            <NumberInput
              label="Intervalo entre Consultas (minutos)"
              min={15}
              max={120}
              step={15}
              {...form.getInputProps('interval')}
              required
            />
            <Switch
              label="Ativo"
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingHour ? 'Atualizar' : 'Adicionar'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

