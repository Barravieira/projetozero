import { useEffect, useState } from 'react';
import { db, storage } from '../../../libs/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  deleteObject,
} from 'firebase/storage';
import { useAuth } from '../../../hooks/useAuth';
import { Button, Table, Image, Title, Stack, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const refProducts = collection(db, 'products');
      const q = query(refProducts, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(list);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleDelete = async (id, imageUrl) => {
    try {
      await deleteDoc(doc(db, 'products', id));

      if (imageUrl) {
        const refImg = ref(storage, decodeURIComponent(new URL(imageUrl).pathname.replace(/^\/v0\/b\/[^/]+\/o\//, '').replace(/\?.*$/, '')));
        await deleteObject(refImg);
      }

      fetchProducts();
    } catch (err) {
      alert('Erro ao excluir produto: ' + err.message);
    }
  };

  const handleEdit = (product) => {
    navigate(`/app/produtos/editar/${product.id}`, { state: product });
  };

  return (
    <Stack>
      <Title order={2}>Produtos</Title>
      <Button onClick={() => navigate('/app/produtos/novo')}>Novo produto</Button>

      <Table highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Imagem</Table.Th>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Descrição</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {products.map((product) => (
            <Table.Tr key={product.id}>
              <Table.Td>
                {product.imageUrl && (
                  <Image src={product.imageUrl} alt="" width={60} height={60} radius="sm" />
                )}
              </Table.Td>
              <Table.Td>{product.name}</Table.Td>
              <Table.Td>{product.description}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Button size="xs" onClick={() => handleEdit(product)}>Editar</Button>
                  <Button size="xs" color="red" onClick={() => handleDelete(product.id, product.imageUrl)}>Excluir</Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
