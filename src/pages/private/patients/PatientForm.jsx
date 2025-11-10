import {
  Button,
  TextInput,
  Stack,
  Group,
  Loader,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
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
import dayjs from 'dayjs';

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
      birthDate: null,
      responsibleName: '',
      schoolName: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Nome é obrigatório'),
      phone: (value) => (value.trim().length > 0 ? null : 'Telefone é obrigatório'),
    },
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name || '',
        phone: initialData.phone || '',
        birthDate: initialData.birthDate?.toDate ? initialData.birthDate.toDate() : null,
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
      const patientData = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        birthDate: values.birthDate ? Timestamp.fromDate(values.birthDate) : null,
        responsibleName: values.responsibleName.trim() || null,
        schoolName: values.schoolName.trim() || null,
        updatedAt: Timestamp.now(),
      };

      if (patientId) {
        const refDoc = doc(db, 'patients', patientId);
        await updateDoc(refDoc, patientData);
      } else {
        await addDoc(collection(db, 'patients'), {
          ...patientData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
      }

      form.reset();
      navigate('/app/pacientes');
    } catch (err) {
      alert('Erro ao salvar paciente: ' + err.message);
    }

    setLoading(false);
  };

  if (fetching) {
    return <Loader />;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Nome"
          placeholder="Nome completo do paciente"
          required
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Telefone"
          placeholder="(00) 00000-0000"
          required
          {...form.getInputProps('phone')}
        />

        <DateInput
          label="Data de Nascimento"
          placeholder="Selecione a data"
          valueFormat="DD/MM/YYYY"
          maxDate={new Date()}
          {...form.getInputProps('birthDate')}
        />

        <TextInput
          label="Nome do Responsável"
          placeholder="Nome do responsável (opcional)"
          {...form.getInputProps('responsibleName')}
        />

        <TextInput
          label="Nome da Escola"
          placeholder="Nome da escola (opcional)"
          {...form.getInputProps('schoolName')}
        />

        <Group justify="flex-end">
          <Button variant="outline" onClick={() => navigate('/app/pacientes')}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {patientId ? 'Atualizar' : 'Salvar Paciente'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

