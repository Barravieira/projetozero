import { useState, useEffect } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Card,
  Loader,
  Badge,
  Modal,
  Select,
  Calendar,
  Grid,
  ActionIcon,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar, IconClock, IconUser, IconTrash, IconEdit, IconSettings } from '@tabler/icons-react';
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
  Timestamp,
} from 'firebase/firestore';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';

export default function AppointmentSchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableHours, setAvailableHours] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm({
    initialValues: {
      patientId: '',
      date: new Date(),
      time: '',
      notes: '',
    },
    validate: {
      patientId: (value) => (value ? null : 'Selecione um paciente'),
      date: (value) => (value ? null : 'Selecione uma data'),
      time: (value) => (value ? null : 'Selecione um horário'),
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if (selectedDate && availableHours.length > 0 && appointments.length >= 0) {
      generateTimeSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, availableHours, appointments]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar pacientes
      const refPatients = collection(db, 'patients');
      const qPatients = query(refPatients, where('userId', '==', user.uid));
      const snapshotPatients = await getDocs(qPatients);
      const patientsList = snapshotPatients.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientsList);

      // Buscar horários disponíveis
      const refHours = collection(db, 'availableHours');
      const qHours = query(refHours, where('userId', '==', user.uid), where('enabled', '==', true));
      const snapshotHours = await getDocs(qHours);
      const hoursList = snapshotHours.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAvailableHours(hoursList);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao buscar dados',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!user || !selectedDate) return;

    try {
      const ref = collection(db, 'appointments');
      const q = query(ref, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const allAppointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filtrar por data no cliente (Firestore não suporta múltiplos where com range)
      const appointmentsList = allAppointments.filter((apt) => {
        if (!apt.date?.toDate) return false;
        const aptDate = dayjs(apt.date.toDate());
        return aptDate.isSame(dayjs(selectedDate), 'day');
      });

      appointmentsList.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        return timeA.localeCompare(timeB);
      });

      setAppointments(appointmentsList);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao buscar consultas',
        color: 'red',
      });
      setAppointments([]);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate || availableHours.length === 0) {
      setTimeSlots([]);
      return;
    }

    try {
      const dayOfWeek = dayjs(selectedDate).day();
      const dayHours = availableHours.filter((h) => h.dayOfWeek === dayOfWeek);

      if (dayHours.length === 0) {
        setTimeSlots([]);
        return;
      }

      const allSlots = [];
      dayHours.forEach((hour) => {
        if (!hour.startTime || !hour.endTime || !hour.interval) return;
        
        const start = dayjs(hour.startTime, 'HH:mm');
        const end = dayjs(hour.endTime, 'HH:mm');
        let current = start;

        while (current.isBefore(end) || current.isSame(end)) {
          const timeStr = current.format('HH:mm');
          // Verificar se já existe consulta neste horário
          const isBooked = appointments.some((apt) => apt.time === timeStr);
          allSlots.push({
            time: timeStr,
            available: !isBooked,
          });
          current = current.add(hour.interval, 'minute');
        }
      });

      // Remover duplicatas e ordenar
      const uniqueSlots = Array.from(
        new Map(allSlots.map((slot) => [slot.time, slot])).values()
      ).sort((a, b) => a.time.localeCompare(b.time));

      setTimeSlots(uniqueSlots);
    } catch (err) {
      console.error('Erro ao gerar horários:', err);
      setTimeSlots([]);
    }
  };

  const handleSubmit = async (values) => {
    if (!user) return;

    try {
      const dateTime = dayjs(values.date)
        .hour(parseInt(values.time.split(':')[0]))
        .minute(parseInt(values.time.split(':')[1]))
        .second(0)
        .millisecond(0);

      const data = {
        userId: user.uid,
        patientId: values.patientId,
        date: Timestamp.fromDate(dateTime.toDate()),
        time: values.time,
        notes: values.notes || '',
        createdAt: Timestamp.now(),
      };

      if (editingAppointment) {
        await updateDoc(doc(db, 'appointments', editingAppointment.id), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Consulta atualizada com sucesso!',
          color: 'green',
        });
      } else {
        await addDoc(collection(db, 'appointments'), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Consulta agendada com sucesso!',
          color: 'green',
        });
      }

      form.reset();
      setEditingAppointment(null);
      closeModal();
      fetchAppointments();
      generateTimeSlots();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar consulta',
        color: 'red',
      });
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    const appointmentDate = appointment.date?.toDate ? appointment.date.toDate() : new Date();
    form.setValues({
      patientId: appointment.patientId,
      date: appointmentDate,
      time: appointment.time,
      notes: appointment.notes || '',
    });
    setSelectedDate(appointmentDate);
    openModal();
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;

    try {
      await deleteDoc(doc(db, 'appointments', id));
      notifications.show({
        title: 'Sucesso',
        message: 'Consulta excluída com sucesso!',
        color: 'green',
      });
      fetchAppointments();
      generateTimeSlots();
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir consulta',
        color: 'red',
      });
    }
  };

  const getPatientName = (patientId) => {
    return patients.find((p) => p.id === patientId)?.name || 'Paciente não encontrado';
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    form.setFieldValue('date', date);
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    form.setValues({
      patientId: '',
      date: selectedDate,
      time: '',
      notes: '',
    });
    openModal();
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
        <Title order={2}>Agenda de Consultas</Title>
        <Group gap="xs">
          <Button
            variant="outline"
            leftSection={<IconSettings size={16} />}
            onClick={() => navigate('/app/agenda/horarios')}
          >
            Configurar Horários
          </Button>
          <Button leftSection={<IconCalendar size={16} />} onClick={handleNewAppointment}>
            Nova Consulta
          </Button>
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Calendar
              value={selectedDate}
              onChange={handleDateChange}
              locale="pt-br"
              firstDayOfWeek={0}
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={3} mb="md">
              {dayjs(selectedDate).format('dddd, DD [de] MMMM [de] YYYY')}
            </Title>

            {appointments.length === 0 && timeSlots.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Nenhum horário disponível para este dia.
                <br />
                Configure os horários disponíveis primeiro.
              </Text>
            ) : (
              <Stack gap="md">
                {appointments.length > 0 && (
                  <>
                    <Text fw={600} size="sm" c="dimmed">
                      Consultas Agendadas
                    </Text>
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} withBorder padding="md" radius="md">
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <IconClock size={16} />
                              <Text fw={600} size="sm">
                                {appointment.time}
                              </Text>
                            </Group>
                            <Group gap="xs" mb="xs">
                              <IconUser size={16} />
                              <Text size="sm">
                                {getPatientName(appointment.patientId)}
                              </Text>
                            </Group>
                            {appointment.notes && (
                              <Text size="xs" c="dimmed" mt="xs">
                                {appointment.notes}
                              </Text>
                            )}
                          </div>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEdit(appointment)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDelete(appointment.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </>
                )}

                {timeSlots.length > 0 && (
                  <>
                    <Text fw={600} size="sm" c="dimmed" mt="md">
                      Horários Disponíveis
                    </Text>
                    <Group gap="xs">
                      {timeSlots.map((slot) => (
                        <Badge
                          key={slot.time}
                          variant={slot.available ? 'light' : 'filled'}
                          color={slot.available ? 'green' : 'gray'}
                          size="lg"
                          style={{ cursor: slot.available ? 'pointer' : 'not-allowed' }}
                          onClick={() => {
                            if (slot.available) {
                              form.setValues({
                                patientId: '',
                                date: selectedDate,
                                time: slot.time,
                                notes: '',
                              });
                              openModal();
                            }
                          }}
                        >
                          {slot.time}
                        </Badge>
                      ))}
                    </Group>
                  </>
                )}
              </Stack>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          form.reset();
          setEditingAppointment(null);
        }}
        title={editingAppointment ? 'Editar Consulta' : 'Nova Consulta'}
        size={isMobile ? '100%' : 'md'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Paciente"
              data={patients.map((p) => ({ value: p.id, label: p.name }))}
              searchable
              {...form.getInputProps('patientId')}
              required
            />
            <DateInput
              label="Data"
              value={form.values.date}
              onChange={(date) => {
                if (date) {
                  form.setFieldValue('date', date);
                  setSelectedDate(date);
                }
              }}
              locale="pt-br"
              required
            />
            <Select
              label="Horário"
              data={timeSlots
                .filter((slot) => slot.available || slot.time === form.values.time)
                .map((slot) => ({ value: slot.time, label: slot.time }))}
              {...form.getInputProps('time')}
              required
            />
            <Textarea
              label="Observações"
              {...form.getInputProps('notes')}
              rows={3}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAppointment ? 'Atualizar' : 'Agendar'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

