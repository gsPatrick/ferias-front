// src/app/(dashboard)/usuarios/page.js
'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import Table from '@/components/Table/Table';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ActionMenu from '@/components/ActionMenu/ActionMenu';
import styles from './usuarios.module.css';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';

export default function UsuariosPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, data: null, isOpen: false });

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

    useEffect(() => {
        fetchUsers();
    }, []);

    const openModal = (type, data = null) => setModalState({ type, data, isOpen: true });
    const closeModal = () => setModalState({ type: null, data: null, isOpen: false });

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
            fetchUsers();
        } catch (error) {
            console.error("Falha ao salvar usuário:", error);
            alert(error.response?.data?.message || "Erro ao salvar usuário.");
        }
    };

    const handleDeleteUser = async () => {
        if (!modalState.data?.id) return;
        try {
            await api.users.remove(modalState.data.id);
            alert('Usuário excluído com sucesso!');
            closeModal();
            fetchUsers();
        } catch (error) {
            console.error("Falha ao excluir usuário:", error);
            alert(error.response?.data?.message || "Erro ao excluir usuário.");
        }
    };

    const columns = [
        { header: 'Nome', accessor: 'nome' },
        { header: 'E-mail', accessor: 'email' },
        { header: 'Função', accessor: 'role', cell: (row) => <span className={styles.roleBadge}>{row.role}</span> },
        { header: 'Ações', accessor: 'acoes', cell: (row) => (
            <ActionMenu items={[
                { label: 'Editar', icon: <Edit size={16} />, onClick: () => openModal('edit', row) },
                { label: 'Excluir', icon: <Trash2 size={16} />, variant: 'danger', onClick: () => openModal('delete', row) }
            ]} />
        )}
    ];

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <Users size={32} />
                        <h1>Gerenciar Usuários</h1>
                    </div>
                    <Button icon={<UserPlus size={16} />} onClick={() => openModal('add')}>
                        Adicionar Usuário
                    </Button>
                </div>
                <div className={styles.tableWrapper}>
                    <Table columns={columns} data={users} isLoading={isLoading} />
                </div>
            </div>

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
                            
                            {/* ========================================================== */}
                            {/* CAMPO DE ROLE ADICIONADO AQUI */}
                            {/* ========================================================== */}
                            <div className={styles.formGroup}>
                                <label htmlFor="role">Função</label>
                                <select id="role" name="role" defaultValue={modalState.data?.role || 'admin'} required>
                                    <option value="admin">Administrador</option>
                                    <option value="user">Usuário Padrão</option>
                                    {/* Adicione outras roles aqui se necessário */}
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