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
            const role = String(user.role);
            const makeAdminButton = role === "admin" ? '' : `<button class='btn btn-success' onclick='toggleAdmin(${user.user_id})'>Make Admin</button>`;
            const removeAdminButton = role === "admin" ? `<button class='btn btn-warning' onclick='toggleAdmin(${user.user_id})'>Remove Admin</button>` : '';
            tr.innerHTML = `
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
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
    const response = await axios.get('/api/getEquipment');
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
                <td>${equipment.available_quantity ? equipment.available_quantity : 0}</td>
                <td>
                    <button class='btn btn-warning' onclick= 'editEquipment(${equipment.equipment_id})'>Edit</button>
                </td>
                <td>
                    <button class='btn btn-danger' onclick= 'deleteEquipment(${equipment.equipment_id})'>Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }
}


const editEquipment = async (id) => {
    await axios.post(`/admin/equipment/${id}`);
    await loadEquipment();
}

const deleteEquipment = async (equipmentId) => {
    await axios.delete(`/admin/equipment/${equipmentId}`);
    await loadEquipment();
}

const openAddEquipmentModal = () => {
    const modal = document.getElementById('addEquipmentModal');
    const backdrop = document.createElement('div');
    backdrop.classList.add('modal-backdrop', 'fade', 'show');
    document.body.appendChild(backdrop);
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeAddEquipmentModal() {
    const modal = document.getElementById('addEquipmentModal');
    const backdrop = document.querySelector('.modal-backdrop');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    backdrop.parentNode.removeChild(backdrop);
}

    
const addEquipment = async () => {
    const name = document.getElementById('equipmentName').value;
    const quantity = document.getElementById('equipmentQuantity').value;

    try {
        // Make a POST request to add equipment
        await axios.post('/admin/addEquipment', { name, quantity });
        
        // Reload equipment list after adding
        await loadEquipment();
        
        // Close the modal
        closeAddEquipmentModal();
    } catch (error) {
        console.error('Error adding equipment:', error);
        // Handle error if needed
    }
}
