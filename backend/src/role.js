const role = {
    Admin: {
        can: ['read', 'write', 'delete'],
    },
    Manager: { // Đổi từ editor thành Manager cho khớp database
        can: ['read', 'write'],
    },
    User: { // Đổi từ viewer thành User cho khớp database
        can: ['read'],
    },
};

export default role;