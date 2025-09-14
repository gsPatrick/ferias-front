// src/app/(dashboard)/usuarios/page.js
'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import styles from './usuarios.module.css';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';

// Este é um componente de página completo, sem depender de um <Table> genérico.
export default function UsuariosPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });

    // Função para buscar os usuários da API
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.users.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error("Falha ao buscar usuários:", error);
            alert("Erro ao buscar usuários.");
        } finally {
            setIsLoading(false);
        }
    };

    // Busca os dados iniciais quando a página carrega
    useEffect(() => {
        fetchUsers();
    }, []);

    // Funções para abrir e fechar o modal
    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });

    // Função para lidar com o envio do formulário (criação e edição)
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            if (modalState.type === 'edit') {
                if (!data.password) delete data.password;
                await api.users.update(modalState.data.id, data);
                alert('Usuário atualizado com sucesso!');
            } else {
                await api.users.create(data);
                alert('Usuário criado com sucesso!');
            }
            closeModal();
            fetchUsers(); // Recarrega os dados da tabela
        } catch (error) {
            console.error("Falha ao salvar usuário:", error);
            alert(error.response?.data?.message || "Erro ao salvar usuário.");
        }
    };

    // Função para confirmar e executar a exclusão
    const handleDeleteUser = async () => {
        if (!modalState.data?.id) return;
        try {
            await api.users.remove(modalState.data.id);
            alert('Usuário excluído com sucesso!');
            closeModal();
            fetchUsers(); // Recarrega os dados da tabela
        } catch (error) {
            console.error("Falha ao excluir usuário:", error);
            alert(error.response?.data?.message || "Erro ao excluir usuário.");
        }
    };

    return (
        <>
            <div className={styles.container}>
                {/* Cabeçalho da Página */}
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <Users size={32} />
                        <h1>Gerenciar Usuários</h1>
                    </div>
                    <Button icon={<UserPlus size={16} />} onClick={() => openModal('add')}>
                        Adicionar Usuário
                    </Button>
                </div>

                {/* Wrapper da Tabela */}
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        {/* Cabeçalho da Tabela */}
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Função</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        {/* Corpo da Tabela */}
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className={styles.loading}>Carregando usuários...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={styles.noData}>Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.nome}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={styles.roleBadge}>{user.role}</span>
                                        </td>
                                        <td>
                                            <ActionMenu items={[
                                                { label: 'Editar', icon: <Edit size={16} />, onClick: () => openModal('edit', user) },
                                                { label: 'Excluir', icon: <Trash2 size={16} />, variant: 'danger', onClick: () => openModal('delete', user) }
                                            ]} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal para Adicionar/Editar/Excluir */}
            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={
                    modalState.type === 'add' ? 'Adicionar Novo Usuário' :
                    modalState.type === 'edit' ? 'Editar Usuário' :
                    'Confirmar Exclusão'
                }
            >
                {modalState.type === 'add' || modalState.type === 'edit' ? (
                    <form onSubmit={handleFormSubmit}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="nome">Nome Completo</label>
                                <input id="nome" name="nome" type="text" defaultValue={modalState.data?.nome} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">E-mail</label>
                                <input id="email" name="email" type="email" defaultValue={modalState.data?.email} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="password">Senha</label>
                                <input id="password" name="password" type="password" placeholder={modalState.type === 'edit' ? 'Deixe em branco para não alterar' : ''} required={modalState.type === 'add'} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="role">Função</label>
                                <select id="role" name="role" defaultValue={modalState.data?.role || 'admin'} required>
                                    <option value="admin">Administrador</option>
                                    <option value="user">Usuário</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                ) : (
                    <div className={styles.modalBody}>
                        <p>Tem certeza que deseja excluir o usuário <strong>{modalState.data?.nome}</strong>?</p>
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDeleteUser}>Excluir</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}