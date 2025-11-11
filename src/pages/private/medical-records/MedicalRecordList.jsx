import { useEffect, useState } from 'react';
import { db } from '../../../libs/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '../../../hooks/useAuth';
import {
  Button,
  Title,
  Stack,
  Group,
  Text,
  Modal,
  Card,
  ActionIcon,
  TextInput,
  Paper,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import dayjs from 'dayjs';

export default function MedicalRecordList() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState({});
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchPatients = async () => {
    if (!user) return;

    try {
      const refPatients = collection(db, 'patients');
      const q = query(refPatients, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const patientsMap = {};
      snapshot.docs.forEach((doc) => {
        patientsMap[doc.id] = doc.data().name;
      });

      setPatients(patientsMap);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    }
  };

  const fetchRecords = async () => {
    if (!user) return;

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
        const dateA = a.treatmentDate?.toDate ? a.treatmentDate.toDate() : new Date(0);
        const dateB = b.treatmentDate?.toDate ? b.treatmentDate.toDate() : new Date(0);
        return dateB - dateA;
      });

      setRecords(list);
      setFilteredRecords(list);
    } catch (err) {
      console.error('Erro ao buscar prontuários:', err);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchRecords();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter((record) => {
        const patientName = patients[record.patientId] || '';
        return patientName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records, patients]);

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
    } catch (err) {
      alert('Erro ao excluir prontuário: ' + err.message);
    }
  };

  const handleEdit = (record) => {
    navigate(`/app/prontuarios/editar/${record.id}`, { state: record });
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

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Prontuários</Title>
        <Button onClick={() => navigate('/app/prontuarios/novo')}>
          Novo Prontuário
        </Button>
      </Group>

      <Paper withBorder p="md" radius="md">
        <TextInput
          placeholder="Buscar por nome do paciente..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          size="md"
        />
      </Paper>

      {filteredRecords.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          {searchTerm ? 'Nenhum prontuário encontrado com essa busca.' : 'Nenhum prontuário cadastrado ainda.'}
        </Text>
      ) : isMobile ? (
        <Stack gap="md">
          {filteredRecords.map((record) => (
            <Card key={record.id} withBorder padding="md" radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="lg">
                      {patients[record.patientId] || 'Paciente não encontrado'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDate(record.treatmentDate)}
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
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {record.notes}
                </Text>
                {record.createdAt && (
                  <Text size="xs" c="dimmed">
                    Criado em: {formatDateTime(record.createdAt)}
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
                    <Group gap="md" align="center">
                      <Text fw={600} size="lg">
                        {patients[record.patientId] || 'Paciente não encontrado'}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {formatDate(record.treatmentDate)}
                      </Text>
                    </Group>
                  </div>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => handleEdit(record)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteClick(record)}
                    >
                      Excluir
                    </Button>
                  </Group>
                </Group>
                <Paper p="sm" bg="gray.0" radius="sm">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {record.notes}
                  </Text>
                </Paper>
                {record.createdAt && (
                  <Text size="xs" c="dimmed">
                    Criado em: {formatDateTime(record.createdAt)}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmar exclusão"
        centered
      >
        <Text mb="md">
          Tem certeza que deseja excluir o prontuário de <strong>{recordToDelete && patients[recordToDelete.patientId]}</strong>?
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

