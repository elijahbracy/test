const deleteUser = async (id) => {
    await axios.delete(`/admin/users/${id}`);
    await loadUsers();
}

const toggleAdmin = async (id) => {
    await axios.post(`/admin/users/${id}`);
    await loadUsers();
}

const loadUsers = async () => {
    const response = await axios.get('/admin/getUsers');
    const tbody = document.querySelector('tbody');
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    //console.log('response', response);
    if (response && response.data && response.data.users) {
        for (const user of response.data.users) {
            const tr = document.createElement('tr');
            const isAdmin = Boolean(user.isAdmin);
            const makeAdminButton = isAdmin ? '' : `<button class='btn btn-success' onclick='toggleAdmin(${user.user_id})'>Make Admin</button>`;
            const removeAdminButton = isAdmin ? `<button class='btn btn-warning' onclick='toggleAdmin(${user.user_id})'>Remove Admin</button>` : '';
            tr.innerHTML = `
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${isAdmin ? 'Yes' : 'No'}</td>
                <td>
                    <button class='btn btn-danger' onclick='deleteUser(${user.user_id})'>Delete</button>
                </td>
                <td>
                    ${makeAdminButton}
                    ${removeAdminButton}
                </td>
            `;
            tbody.appendChild(tr);
        }
        
    }
}

const loadEquipment = async () => {
    const response = await axios.get('/admin/getEquipment');
    const tbody = document.querySelector('tbody');
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    if (response && response.data && response.data.equipment) {
        for (const equipment of response.data.equipment) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${equipment.name}</td>
                <td>${equipment.quantity}</td>
                <td>
                    <button class='btn btn-danger' onclick='deleteUser(${user.user_id})'>Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
        
    }
}