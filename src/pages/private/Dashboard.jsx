import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Paper,
  Title,
  Text,
  Card,
  Button,
  Tabs,
  Loader,
  Badge,
  Grid,
  Modal,
  TextInput,
  Textarea,
  Select,
  ActionIcon,
} from '@mantine/core';
import { Calendar, DateInput, TimeInput } from '@mantine/dates';
import { BarChart, LineChart } from '@mantine/charts';
import { IconCalendar, IconChartBar, IconPlus, IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../libs/firebase';
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
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('daily');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const form = useForm({
    initialValues: {
      patientId: '',
      date: new Date(),
      time: '',
      notes: '',
    },
    validate: {
      patientId: (value) => (value ? null : 'Selecione um paciente'),
      date: (value) => (value ? null : 'Data é obrigatória'),
      time: (value) => (value ? null : 'Horário é obrigatório'),
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
  }, [user, selectedDate, viewMode]);

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
    if (!user) return;

    try {
      const ref = collection(db, 'appointments');
      const q = query(ref, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const allAppointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('Total de agendamentos encontrados:', allAppointments.length);
      allAppointments.forEach((apt) => {
        if (apt.date?.toDate) {
          const aptDate = dayjs(apt.date.toDate());
          console.log('Agendamento:', {
            id: apt.id,
            date: aptDate.format('YYYY-MM-DD'),
            time: apt.time,
            patientId: apt.patientId,
          });
        }
      });

      // Filtrar por período
      let filteredAppointments = allAppointments;
      if (viewMode === 'daily') {
        const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
        console.log('Filtrando agendamentos para a data:', selectedDateStr);
        
        filteredAppointments = allAppointments.filter((apt) => {
          if (!apt.date?.toDate) {
            console.log('Agendamento sem data válida:', apt.id);
            return false;
          }
          const aptDate = dayjs(apt.date.toDate());
          const aptDateStr = aptDate.format('YYYY-MM-DD');
          const isSame = aptDateStr === selectedDateStr;
          console.log('Comparando:', {
            aptDate: aptDateStr,
            selectedDate: selectedDateStr,
            isSame,
          });
          return isSame;
        });
      } else {
        const startOfWeek = dayjs(selectedDate).startOf('week');
        const endOfWeek = dayjs(selectedDate).endOf('week');
        filteredAppointments = allAppointments.filter((apt) => {
          if (!apt.date?.toDate) return false;
          const aptDate = dayjs(apt.date.toDate());
          return aptDate.isAfter(startOfWeek.subtract(1, 'day')) && aptDate.isBefore(endOfWeek.add(1, 'day'));
        });
      }

      console.log('Agendamentos filtrados:', filteredAppointments.length);

      // Ordenar por data e hora
      filteredAppointments.sort((a, b) => {
        const dateA = a.date?.toDate ? dayjs(a.date.toDate()) : dayjs();
        const dateB = b.date?.toDate ? dayjs(b.date.toDate()) : dayjs();
        if (dateA.format('YYYY-MM-DD') === dateB.format('YYYY-MM-DD')) {
          return (a.time || '').localeCompare(b.time || '');
        }
        return dateA.diff(dateB);
      });

      setAppointments(filteredAppointments);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao buscar agendamentos',
        color: 'red',
      });
      setAppointments([]);
    }
  };

  const handleCreateAppointment = () => {
    setEditingAppointment(null);
    form.setValues({
      patientId: '',
      date: selectedDate,
      time: '',
      notes: '',
    });
    openModal();
  };

  const handleEditAppointment = (appointment) => {
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

  const handleSubmit = async (values) => {
    if (!user) return;

    try {
      // Tratar o valor do TimeInput (pode ser Date ou string)
      let timeString = '';
      if (values.time instanceof Date) {
        timeString = dayjs(values.time).format('HH:mm');
      } else if (typeof values.time === 'string') {
        timeString = values.time;
      } else {
        throw new Error('Formato de horário inválido');
      }

      // Validar formato do horário
      const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
      if (!timeMatch) {
        throw new Error('Formato de horário inválido. Use HH:mm');
      }

      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Horário inválido');
      }

      // Criar data/hora combinando data e horário
      const dateTime = dayjs(values.date)
        .hour(hours)
        .minute(minutes)
        .second(0)
        .millisecond(0);

      console.log('Salvando agendamento:', {
        date: dateTime.format('YYYY-MM-DD HH:mm'),
        time: timeString,
        patientId: values.patientId,
      });

      const data = {
        userId: user.uid,
        patientId: values.patientId,
        date: Timestamp.fromDate(dateTime.toDate()),
        time: timeString,
        notes: values.notes || '',
        createdAt: editingAppointment ? editingAppointment.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (editingAppointment) {
        await updateDoc(doc(db, 'appointments', editingAppointment.id), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Agendamento atualizado com sucesso!',
          color: 'green',
        });
      } else {
        await addDoc(collection(db, 'appointments'), data);
        notifications.show({
          title: 'Sucesso',
          message: 'Agendamento criado com sucesso!',
          color: 'green',
        });
      }

      form.reset();
      setEditingAppointment(null);
      closeModal();
      
      // Se o agendamento foi criado para a data selecionada, manter a visualização
      // Se foi criado para outra data, não mudar a visualização atual
      // Apenas atualizar a lista de agendamentos
      fetchAppointments();
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      notifications.show({
        title: 'Erro',
        message: err.message || 'Erro ao salvar agendamento',
        color: 'red',
      });
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      await deleteDoc(doc(db, 'appointments', id));
      notifications.show({
        title: 'Sucesso',
        message: 'Agendamento excluído com sucesso!',
        color: 'green',
      });
      fetchAppointments();
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir agendamento',
        color: 'red',
      });
    }
  };

  const getPatientName = (patientId) => {
    return patients.find((p) => p.id === patientId)?.name || 'Paciente não encontrado';
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return dayjs(timestamp.toDate()).format('HH:mm');
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return dayjs(timestamp.toDate()).format('DD/MM/YYYY');
  };

  const getReportsData = () => {
    const last30Days = [];
    
    for (let i = 0; i < 30; i++) {
      const date = dayjs().subtract(i, 'days');
      const count = appointments.filter((apt) => {
        if (!apt.date?.toDate) return false;
        return dayjs(apt.date.toDate()).isSame(date, 'day');
      }).length;
      
      last30Days.unshift({
        date: date.format('DD/MM'),
        agendamentos: count,
      });
    }

    const appointmentsByMonth = {};
    appointments.forEach((apt) => {
      if (!apt.date?.toDate) return;
      const month = dayjs(apt.date.toDate()).format('MM/YYYY');
      appointmentsByMonth[month] = (appointmentsByMonth[month] || 0) + 1;
    });

    return {
      daily: last30Days,
      monthly: Object.entries(appointmentsByMonth).map(([month, count]) => ({
        month,
        agendamentos: count,
      })),
    };
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader />
        <Text c="dimmed">Carregando...</Text>
      </Stack>
    );
  }

  const reportsData = getReportsData();

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Dashboard</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateAppointment}>
          Novo Agendamento
        </Button>
      </Group>

      <Tabs defaultValue="agenda" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="agenda" leftSection={<IconCalendar size={16} />}>
            Agenda
          </Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconChartBar size={16} />}>
            Relatórios
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="agenda" pt="md">
          <Stack gap="md">
            <Group gap="md" wrap="wrap">
              <Button
                variant={viewMode === 'daily' ? 'filled' : 'outline'}
                onClick={() => setViewMode('daily')}
                size="sm"
              >
                Agenda Diária
              </Button>
              <Button
                variant={viewMode === 'weekly' ? 'filled' : 'outline'}
                onClick={() => setViewMode('weekly')}
                size="sm"
              >
                Agenda Semanal
              </Button>
            </Group>

            {viewMode === 'daily' ? (
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Paper withBorder p="md" radius="md">
                    <Calendar
                      value={selectedDate}
                      onChange={setSelectedDate}
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
                    
                    {appointments.length === 0 ? (
                      <Text c="dimmed" ta="center" py="xl">
                        Nenhum agendamento para este dia.
                      </Text>
                    ) : (
                      <Stack gap="sm">
                        {appointments.map((apt) => (
                          <Card key={apt.id} withBorder padding="md" radius="md">
                            <Group justify="space-between" align="flex-start">
                              <div style={{ flex: 1 }}>
                                <Group gap="xs" mb="md">
                                  <IconUser size={18} />
                                  <Text fw={600} size="md">
                                    {getPatientName(apt.patientId)}
                                  </Text>
                                </Group>
                                <Group gap="sm" mb="md">
                                  <Badge variant="filled" color="blue" size="lg" leftSection={<IconCalendar size={14} />}>
                                    {apt.time}
                                  </Badge>
                                </Group>
                                {apt.notes && (
                                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
                                    <Text size="xs" fw={600} c="dimmed" mb={4}>
                                      Observações:
                                    </Text>
                                    <Text size="sm" c="dark" style={{ lineHeight: 1.6 }}>
                                      {apt.notes}
                                    </Text>
                                  </div>
                                )}
                              </div>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => handleEditAppointment(apt)}
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDeleteAppointment(apt.id)}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Grid.Col>
              </Grid>
            ) : (
              <Paper withBorder p="md" radius="md">
                <Title order={3} mb="md">
                  Semana de {dayjs(selectedDate).startOf('week').format('DD/MM')} a{' '}
                  {dayjs(selectedDate).endOf('week').format('DD/MM/YYYY')}
                </Title>
                
                {appointments.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    Nenhum agendamento para esta semana.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const day = dayjs(selectedDate).startOf('week').add(index, 'days');
                      const dayAppointments = appointments.filter((apt) => {
                        if (!apt.date?.toDate) return false;
                        return dayjs(apt.date.toDate()).isSame(day, 'day');
                      });

                      if (dayAppointments.length === 0) return null;

                      return (
                        <Card key={index} withBorder padding="md" radius="md">
                          <Text fw={600} size="lg" mb="sm">
                            {day.format('dddd, DD/MM')}
                          </Text>
                          <Stack gap="md">
                            {dayAppointments.map((apt) => (
                              <Card key={apt.id} withBorder padding="sm" radius="md">
                                <Group justify="space-between" align="flex-start">
                                  <div style={{ flex: 1 }}>
                                    <Group gap="sm" mb="xs">
                                      <Badge variant="filled" color="blue" size="md">
                                        {apt.time}
                                      </Badge>
                                      <Text size="sm" fw={600}>
                                        {getPatientName(apt.patientId)}
                                      </Text>
                                    </Group>
                                    {apt.notes && (
                                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '6px' }}>
                                        <Text size="xs" fw={600} c="dimmed" mb={2}>
                                          Observações:
                                        </Text>
                                        <Text size="xs" c="dark" style={{ lineHeight: 1.5 }}>
                                          {apt.notes}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                  <Group gap="xs">
                                    <ActionIcon
                                      variant="light"
                                      color="blue"
                                      size="sm"
                                      onClick={() => handleEditAppointment(apt)}
                                    >
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      size="sm"
                                      onClick={() => handleDeleteAppointment(apt.id)}
                                    >
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Group>
                                </Group>
                              </Card>
                            ))}
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="reports" pt="md">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder padding="md" radius="md">
                  <Title order={4} mb="md">
                    Total de Pacientes
                  </Title>
                  <Text size="xl" fw={700} c="blue">
                    {patients.length}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Card withBorder padding="md" radius="md">
                  <Title order={4} mb="md">
                    Total de Agendamentos
                  </Title>
                  <Text size="xl" fw={700} c="green">
                    {appointments.length}
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>

            {reportsData.daily.length > 0 && (
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">
                  Agendamentos nos Últimos 30 Dias
                </Title>
                <LineChart
                  h={300}
                  data={reportsData.daily}
                  dataKey="date"
                  series={[{ name: 'agendamentos', color: 'blue', label: 'Agendamentos' }]}
                  curveType="natural"
                />
              </Paper>
            )}

            {reportsData.monthly.length > 0 && (
              <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">
                  Agendamentos por Mês
                </Title>
                <BarChart
                  h={300}
                  data={reportsData.monthly}
                  dataKey="month"
                  series={[{ name: 'agendamentos', color: 'green', label: 'Agendamentos' }]}
                />
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          form.reset();
          setEditingAppointment(null);
        }}
        title={editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Paciente"
              data={patients.map((p) => ({ value: p.id, label: p.name }))}
              searchable
              placeholder="Selecione um paciente"
              {...form.getInputProps('patientId')}
              required
            />
            <DateInput
              label="Data"
              value={form.values.date}
              onChange={(date) => {
                if (date) {
                  form.setFieldValue('date', date);
                  // Não atualizar selectedDate aqui para não mudar a visualização
                }
              }}
              locale="pt-br"
              required
            />
            <TimeInput
              label="Horário"
              placeholder="Ex: 14:30"
              {...form.getInputProps('time')}
              required
            />
            <Textarea
              label="Observações"
              placeholder="Observações sobre o agendamento (opcional)"
              {...form.getInputProps('notes')}
              rows={3}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAppointment ? 'Atualizar' : 'Criar Agendamento'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
