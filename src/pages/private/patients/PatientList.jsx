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
import { Button, Table, Title, Stack, Group, Text, Modal, Card, ActionIcon } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchPatients = async () => {
    if (!user) return;

    try {
      const refPatients = collection(db, 'patients');
      const q = query(refPatients, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPatients(list);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    try {
      await deleteDoc(doc(db, 'patients', patientToDelete.id));
      fetchPatients();
      closeDeleteModal();
      setPatientToDelete(null);
    } catch (err) {
      alert('Erro ao excluir paciente: ' + err.message);
    }
  };

  const handleEdit = (patient) => {
    navigate(`/app/pacientes/editar/${patient.id}`, { state: patient });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) {
      return dayjs(timestamp.toDate()).format('DD/MM/YYYY');
    }
    return '-';
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Title order={2}>Lista de Pacientes</Title>
        <Button onClick={() => navigate('/app/pacientes')}>
          Novo paciente
        </Button>
      </Group>

      {patients.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum paciente cadastrado ainda.
        </Text>
      ) : isMobile ? (
        <Stack gap="md">
          {patients.map((patient) => (
            <Card key={patient.id} withBorder padding="md" radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text fw={600} size="lg">
                      {patient.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {patient.phone}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleEdit(patient)}
                      title="Editar"
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteClick(patient)}
                      title="Excluir"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
                {formatDate(patient.birthDate) !== '-' && (
                  <Text size="sm">
                    <strong>Data de Nascimento:</strong> {formatDate(patient.birthDate)}
                  </Text>
                )}
                {patient.responsibleName && (
                  <Text size="sm">
                    <strong>Responsável:</strong> {patient.responsibleName}
                  </Text>
                )}
                {patient.schoolName && (
                  <Text size="sm">
                    <strong>Escola:</strong> {patient.schoolName}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Telefone</Table.Th>
                <Table.Th>Data de Nascimento</Table.Th>
                <Table.Th>Responsável</Table.Th>
                <Table.Th>Escola</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {patients.map((patient) => (
                <Table.Tr key={patient.id}>
                  <Table.Td>{patient.name}</Table.Td>
                  <Table.Td>{patient.phone}</Table.Td>
                  <Table.Td>{formatDate(patient.birthDate)}</Table.Td>
                  <Table.Td>{patient.responsibleName || '-'}</Table.Td>
                  <Table.Td>{patient.schoolName || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Button size="xs" onClick={() => handleEdit(patient)}>
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        Excluir
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmar exclusão"
        centered
      >
        <Text mb="md">
          Tem certeza que deseja excluir o paciente <strong>{patientToDelete?.name}</strong>?
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

