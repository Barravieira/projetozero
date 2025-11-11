import {
  Button,
  TextInput,
  Textarea,
  Stack,
  Group,
  Loader,
  Paper,
  Title,
  Select,
  DateInput,
  ActionIcon,
  Card,
  Modal,
  Divider,
  Text,
} from '@mantine/core';
import { IconList, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
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
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export default function MedicalRecord() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [showList, setShowList] = useState(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm({
    initialValues: {
      patientId: '',
      sessionDate: new Date(),
      step: '',
      notes: '',
    },
    validate: {
      patientId: (value) => (value ? null : 'Selecione um paciente'),
      sessionDate: (value) => (value ? null : 'Data da sessão é obrigatória'),
      step: (value) => (value.trim().length > 0 ? null : 'Passo do atendimento é obrigatório'),
      notes: (value) => (value.trim().length > 0 ? null : 'Anotações são obrigatórias'),
    },
  });

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return;

      try {
        const refPatients = collection(db, 'patients');
        const q = query(refPatients, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
        }));

        setPatients(list);
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    setLoadingRecords(true);
    try {
      const refRecords = collection(db, 'medicalRecords');
      const q = query(refRecords, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar por data mais recente primeiro
      list.sort((a, b) => {
        const dateA = a.sessionDate?.toDate ? a.sessionDate.toDate() : new Date(0);
        const dateB = b.sessionDate?.toDate ? b.sessionDate.toDate() : new Date(0);
        return dateB - dateA;
      });

      setRecords(list);
      setFilteredRecords(list);
    } catch (err) {
      console.error('Erro ao buscar prontuários:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    let filtered = records;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter((record) => {
        const patientName = patients.find((p) => p.value === record.patientId)?.label || '';
        return patientName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedPatientId) {
      filtered = filtered.filter((record) => record.patientId === selectedPatientId);
    }

    setFilteredRecords(filtered);
  }, [searchTerm, selectedPatientId, records, patients]);

  useEffect(() => {
    if (editingRecord) {
      form.setValues({
        patientId: editingRecord.patientId || '',
        sessionDate: editingRecord.sessionDate?.toDate ? editingRecord.sessionDate.toDate() : new Date(),
        step: editingRecord.step || '',
        notes: editingRecord.notes || '',
      });
      setSelectedPatientId(editingRecord.patientId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRecord]);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const recordData = {
        patientId: values.patientId,
        sessionDate: Timestamp.fromDate(values.sessionDate),
        step: values.step.trim(),
        notes: values.notes.trim(),
        updatedAt: Timestamp.now(),
      };

      if (editingRecord) {
        const refDoc = doc(db, 'medicalRecords', editingRecord.id);
        await updateDoc(refDoc, recordData);
        notifications.show({
          title: 'Sucesso!',
          message: 'Prontuário atualizado com sucesso.',
          color: 'green',
        });
        setEditingRecord(null);
      } else {
        await addDoc(collection(db, 'medicalRecords'), {
          ...recordData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
        notifications.show({
          title: 'Sucesso!',
          message: 'Anotação do atendimento salva com sucesso.',
          color: 'green',
        });
      }

      form.reset();
      form.setFieldValue('sessionDate', new Date());
      setSelectedPatientId('');
      fetchRecords();
    } catch (err) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar prontuário: ' + err.message,
        color: 'red',
      });
    }

    setLoading(false);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await deleteDoc(doc(db, 'medicalRecords', recordToDelete.id));
      fetchRecords();
      closeDeleteModal();
      setRecordToDelete(null);
      notifications.show({
        title: 'Sucesso!',
        message: 'Anotação excluída com sucesso.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir anotação: ' + err.message,
        color: 'red',
      });
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    form.reset();
    form.setFieldValue('sessionDate', new Date());
    setSelectedPatientId('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) {
      return dayjs(timestamp.toDate()).format('DD/MM/YYYY');
    }
    return '-';
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) {
      return dayjs(timestamp.toDate()).format('DD/MM/YYYY [às] HH:mm');
    }
    return '-';
  };

  const getPatientName = (patientId) => {
    return patients.find((p) => p.value === patientId)?.label || 'Paciente não encontrado';
  };

  if (loadingPatients) {
    return (
      <Stack align="center" justify="center" h="50vh">
        <Loader />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" maw={{ base: '100%', sm: 800 }} mx="auto" w="100%">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2}>
              {editingRecord ? 'Editar Anotação do Atendimento' : 'Novo Atendimento'}
            </Title>
            {!editingRecord && (
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => setShowList(!showList)}
                title={showList ? 'Ocultar lista' : 'Ver lista de atendimentos'}
              >
                <IconList size={20} />
              </ActionIcon>
            )}
          </Group>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Select
                label="Paciente"
                placeholder="Selecione um paciente"
                data={patients}
                searchable
                required
                size="md"
                disabled={!!editingRecord}
                value={selectedPatientId || form.values.patientId}
                onChange={(value) => {
                  form.setFieldValue('patientId', value || '');
                  setSelectedPatientId(value || '');
                }}
                error={form.errors.patientId}
              />

              <DateInput
                label="Data da Sessão"
                placeholder="Selecione a data"
                valueFormat="DD/MM/YYYY"
                maxDate={new Date()}
                size="md"
                required
                {...form.getInputProps('sessionDate')}
              />

              <TextInput
                label="Passo do Atendimento"
                placeholder="Ex: Avaliação inicial, Intervenção, Acompanhamento..."
                required
                size="md"
                {...form.getInputProps('step')}
              />

              <Textarea
                label="Anotações do Atendimento"
                placeholder="Descreva detalhadamente o passo do atendimento realizado..."
                required
                size="md"
                minRows={5}
                autosize
                {...form.getInputProps('notes')}
              />

              <Group justify="flex-end" gap="sm" mt="md">
                {editingRecord && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" loading={loading} size="md">
                  {editingRecord ? 'Atualizar Anotação' : 'Salvar Anotação'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>

      {(showList || filteredRecords.length > 0) && (
        <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" maw={{ base: '100%', sm: 800 }} mx="auto" w="100%">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3}>Histórico de Atendimentos</Title>
              {!showList && (
                <Button
                  variant="light"
                  leftSection={<IconList size={16} />}
                  onClick={() => setShowList(true)}
                >
                  Ver Lista
                </Button>
              )}
            </Group>

            {showList && (
              <>
                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <TextInput
                      placeholder="Buscar por nome do paciente..."
                      leftSection={<IconSearch size={16} />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      size="md"
                    />
                    <Select
                      placeholder="Filtrar por paciente"
                      data={[{ value: '', label: 'Todos os pacientes' }, ...patients]}
                      value={selectedPatientId}
                      onChange={setSelectedPatientId}
                      clearable
                      size="md"
                    />
                  </Stack>
                </Paper>

                {loadingRecords ? (
                  <Loader />
                ) : filteredRecords.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    {searchTerm || selectedPatientId
                      ? 'Nenhum atendimento encontrado com os filtros aplicados.'
                      : 'Nenhum atendimento registrado ainda.'}
                  </Text>
                ) : isMobile ? (
                  <Stack gap="md">
                    {filteredRecords.map((record) => (
                      <Card key={record.id} withBorder padding="md" radius="md">
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Text fw={600} size="lg">
                                {getPatientName(record.patientId)}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {formatDate(record.sessionDate)}
                              </Text>
                              <Text size="sm" fw={500} c="blue" mt={4}>
                                {record.step}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleEdit(record)}
                                title="Editar"
                              >
                                <IconEdit size={18} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDeleteClick(record)}
                                title="Excluir"
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Group>
                          </Group>
                          <Divider />
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {record.notes}
                          </Text>
                          {record.createdAt && (
                            <Text size="xs" c="dimmed">
                              Registrado em: {formatDateTime(record.createdAt)}
                            </Text>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="md">
                    {filteredRecords.map((record) => (
                      <Card key={record.id} withBorder padding="md" radius="md">
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Group gap="md" align="center" mb={4}>
                                <Text fw={600} size="lg">
                                  {getPatientName(record.patientId)}
                                </Text>
                                <Text size="sm" c="dimmed">
                                  {formatDate(record.sessionDate)}
                                </Text>
                              </Group>
                              <Text size="sm" fw={500} c="blue">
                                Passo: {record.step}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconEdit size={14} />}
                                onClick={() => handleEdit(record)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="xs"
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDeleteClick(record)}
                              >
                                Excluir
                              </Button>
                            </Group>
                          </Group>
                          <Divider />
                          <Paper p="sm" bg="gray.0" radius="sm">
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                              {record.notes}
                            </Text>
                          </Paper>
                          {record.createdAt && (
                            <Text size="xs" c="dimmed">
                              Registrado em: {formatDateTime(record.createdAt)}
                            </Text>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </Paper>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmar exclusão"
        centered
      >
        <Text mb="md">
          Tem certeza que deseja excluir a anotação do atendimento de <strong>{recordToDelete && getPatientName(recordToDelete.patientId)}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancelar
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Excluir
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

