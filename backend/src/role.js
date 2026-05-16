const role = {
    admin: {
        can: [
            'read',
            'write',
            'delete',
        ],

    },
    editor: {
        can: [
            'read',
            'write'
        ],
    },
    viewer: {
        can: [
            'read',
        ],
    },
};

export default role;