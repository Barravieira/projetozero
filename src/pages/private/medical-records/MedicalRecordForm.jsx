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
} from '@mantine/core';
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
} from 'firebase/firestore';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export default function MedicalRecordForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: recordId } = useParams();
  const stateData = location.state;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!stateData && !!recordId);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const form = useForm({
    initialValues: {
      patientId: '',
      treatmentDate: new Date(),
      notes: '',
    },
    validate: {
      patientId: (value) => (value ? null : 'Selecione um paciente'),
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
    if (stateData) {
      form.setValues({
        patientId: stateData.patientId || '',
        treatmentDate: stateData.treatmentDate?.toDate ? stateData.treatmentDate.toDate() : new Date(),
        notes: stateData.notes || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateData]);

  useEffect(() => {
    if (!stateData && recordId) {
      const fetchRecord = async () => {
        try {
          const refDoc = doc(db, 'medicalRecords', recordId);
          const snap = await getDoc(refDoc);
          if (snap.exists()) {
            const data = snap.data();
            form.setValues({
              patientId: data.patientId || '',
              treatmentDate: data.treatmentDate?.toDate ? data.treatmentDate.toDate() : new Date(),
              notes: data.notes || '',
            });
          } else {
            notifications.show({
              title: 'Erro',
              message: 'Prontuário não encontrado.',
              color: 'red',
            });
            navigate('/app/prontuarios');
          }
        } catch (err) {
          notifications.show({
            title: 'Erro',
            message: 'Erro ao carregar prontuário: ' + err.message,
            color: 'red',
          });
          navigate('/app/prontuarios');
        } finally {
          setFetching(false);
        }
      };

      fetchRecord();
    }
  }, [stateData, recordId, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const recordData = {
        patientId: values.patientId,
        treatmentDate: Timestamp.fromDate(values.treatmentDate),
        notes: values.notes.trim(),
        updatedAt: Timestamp.now(),
      };

      if (recordId) {
        const refDoc = doc(db, 'medicalRecords', recordId);
        await updateDoc(refDoc, recordData);
        notifications.show({
          title: 'Sucesso!',
          message: 'Prontuário atualizado com sucesso.',
          color: 'green',
        });
        navigate('/app/prontuarios');
      } else {
        await addDoc(collection(db, 'medicalRecords'), {
          ...recordData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
        notifications.show({
          title: 'Sucesso!',
          message: 'Prontuário cadastrado com sucesso.',
          color: 'green',
        });
        form.reset();
        form.setFieldValue('treatmentDate', new Date());
      }
    } catch (err) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar prontuário: ' + err.message,
        color: 'red',
      });
    }

    setLoading(false);
  };

  if (fetching || loadingPatients) {
    return <Loader />;
  }

  const isEditMode = !!recordId;

  return (
    <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" maw={{ base: '100%', sm: 800 }} mx="auto" w="100%">
      <Stack gap="md">
        <Title order={2}>
          {isEditMode ? 'Editar Prontuário' : 'Novo Prontuário'}
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Paciente"
              placeholder="Selecione um paciente"
              data={patients}
              searchable
              required
              size="md"
              disabled={isEditMode}
              {...form.getInputProps('patientId')}
            />

            <DateInput
              label="Data do Tratamento"
              placeholder="Selecione a data"
              valueFormat="DD/MM/YYYY"
              maxDate={new Date()}
              size="md"
              required
              {...form.getInputProps('treatmentDate')}
            />

            <Textarea
              label="Anotações do Tratamento"
              placeholder="Descreva o tratamento realizado..."
              required
              size="md"
              minRows={4}
              autosize
              {...form.getInputProps('notes')}
            />

            <Group justify="flex-end" gap="sm" mt="md">
              {isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/app/prontuarios')}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" loading={loading} size="md">
                {isEditMode ? 'Atualizar' : 'Salvar Prontuário'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}

