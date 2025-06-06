import {
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Stack,
  Group,
  Image,
  FileInput,
  Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { db, storage } from '../../../libs/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

export default function ProductForm({ onSave }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: productId } = useParams();
  const stateData = location.state;

  const [initialData, setInitialData] = useState(stateData || null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(stateData?.imageUrl || null);
  const [fetching, setFetching] = useState(!stateData && !!productId);

  const form = useForm({
    initialValues: {
      name: '',
      price: 0,
      description: '',
      image: null,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.setValues({
        name: initialData.name || '',
        price: initialData.price || 0,
        description: initialData.description || '',
        image: null,
      });
      setPreview(initialData.imageUrl || null);
    }
  }, [initialData]);

  useEffect(() => {
    if (!stateData && productId) {
      const fetchProduct = async () => {
        try {
          const refDoc = doc(db, 'products', productId);
          const snap = await getDoc(refDoc);
          if (snap.exists()) {
            const data = snap.data();
            setInitialData(data);
            setPreview(data.imageUrl || null);
          } else {
            alert('Produto não encontrado.');
            navigate('/app/produtos');
          }
        } catch (err) {
          alert('Erro ao carregar produto: ' + err.message);
          navigate('/app/produtos');
        } finally {
          setFetching(false);
        }
      };

      fetchProduct();
    }
  }, [stateData, productId, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      let imageUrl = initialData?.imageUrl || null;

      if (values.image) {
        // Se estiver atualizando, exclui imagem antiga
        if (imageUrl && productId) {
          const oldRef = ref(storage, decodeURIComponent(new URL(imageUrl).pathname.replace(/^\/v0\/b\/[^/]+\/o\//, '').replace(/\?.*$/, '')));
          try {
            await deleteObject(oldRef);
          } catch (e) {
            console.warn('Não foi possível excluir imagem antiga:', e.message);
          }
        }

        const imageRef = ref(storage, `products/${user.uid}/${Date.now()}-${values.image.name}`);
        await uploadBytes(imageRef, values.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const productData = {
        name: values.name,
        price: values.price,
        description: values.description,
        imageUrl,
        updatedAt: Timestamp.now(),
      };

      if (productId) {
        const refDoc = doc(db, 'products', productId);
        await updateDoc(refDoc, productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
      }

      form.reset();
      setPreview(null);
      onSave?.();
      navigate('/app/produtos');
    } catch (err) {
      alert('Erro ao salvar produto: ' + err.message);
    }

    setLoading(false);
  };

  if (fetching) {
    return <Loader />;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Nome" {...form.getInputProps('name')} />
        <NumberInput label="Preço" {...form.getInputProps('price')} />
        <Textarea label="Descrição" {...form.getInputProps('description')} />

        <FileInput
          label="Imagem"
          accept="image/*"
          onChange={(file) => {
            form.setFieldValue('image', file);
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result);
              reader.readAsDataURL(file);
            } else {
              setPreview(initialData?.imageUrl || null);
            }
          }}
        />

        {preview && <Image src={preview} alt="Preview" w={160} radius="md" />}

        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            {productId ? 'Atualizar' : 'Salvar Produto'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
