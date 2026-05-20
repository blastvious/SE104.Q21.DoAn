import { roles } from "./config/role.js";

export const canAccessPage = (user, page) => {
    if (!user) return false;

    const role = roles[user.role];
    if (!role) return false;

    if (role.pages.includes("*")) return true;

    return role.pages.includes(page);
};

export const can = (user, permission) => {
    if (!user) return false;

    const role = roles[user.role];
    if (!role) return false;

    return role.permissions.includes(permission);
};