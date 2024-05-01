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

document.addEventListener("DOMContentLoaded", function() {
    const allRentalsButton = document.getElementById("allRentalsButton");
    allRentalsButton.addEventListener("click", function() {
        getAllRentals();
    });
});

const getAllRentals = async () => { 
    const response = await axios.get('/admin/getAllRentals');
    console.log(response);
    createRentalTable(response.data);
}

// Pagination parameters
let currentPage = 1;
const pageSize = 10; // Number of rentals per page

const fetchRentals = async () => {

    const response = await axios.get(`/admin/getRentals?page=${currentPage}&pageSize=${pageSize}`);
    await createRentalTable(response.data);

    // Enable/disable pagination buttons based on current page
    document.getElementById('prevPageButton').disabled = currentPage === 1;
    document.getElementById('nextPageButton').disabled = response.data.rentalsWithEquipment.length < pageSize;
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prevPageButton').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchRentals();
        }
    });
    
    document.getElementById('nextPageButton').addEventListener('click', () => {
        currentPage++;
        fetchRentals();
    });
});



const createRentalTable = async (rentals) => {
    // get table body
    const tbody = document.querySelector('tbody');
    
    //remove existing elements of tbody
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    for (const rental of rentals.rentalsWithEquipment) {
        const tr = document.createElement('tr');
        // Add a click event listener to each row
        tr.dataset.id = rental.rental_id;
        tr.addEventListener('click', onRowClick);
        tr.classList.add('clickable');
        tr.innerHTML = `
        <td>${rental.first_name} ${rental.last_name}</td>
        <td>${rental.equipment}</td>
        <td>${rental.rental_start_date}</td>
        <td>${rental.rental_end_date}</td>
        <td>${rental.rental_status}</td>
        <td>${rental.course}</td>
        <td>${rental.notes}</td>
        `;
        
        
        
        tbody.appendChild(tr);
    }
}

const onRowClick = (e) => {
    //console.log(e.target.parentNode);
    let row = e.target;
    if (e.target.tagName.toUpperCase() === 'TD') {
        row = e.target.parentNode;
    }
    console.log(row.dataset.id);
    const rental_id = row.dataset.id;
    window.location.href = `/admin/rentals/${rental_id}`;
};



const loadRentals = async () => {
    const response = await axios.get('/admin/getRentals');
    const tbody = document.querySelector('tbody');
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    //console.log('response', response);
    if (response && response.data && response.data.rentals) {
        for (const rental of response.data.rentals) {
            const tr = document.createElement('tr');
            //const role = String(user.role);
            //const makeAdminButton = role === "admin" ? '' : `<button class='btn btn-success' onclick='toggleAdmin(${user.user_id})'>Make Admin</button>`;
            //const removeAdminButton = role === "admin" ? `<button class='btn btn-warning' onclick='toggleAdmin(${user.user_id})'>Remove Admin</button>` : '';
            tr.innerHTML = `
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            `;
            tbody.appendChild(tr);
        }
    }
}
