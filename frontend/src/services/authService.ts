const AUTH_URL = "http://localhost:5132/api/auth";

export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type CurrentUser = {
    username: string;
    email: string;
};

export async function register(
    data: RegisterRequest
): Promise<void> {
    const response = await fetch(
        `${AUTH_URL}/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
            }),
        }
    );

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message || "Registracija nije uspjela."
        );
    }
}

export async function login(
    data: LoginRequest
): Promise<void> {
    const response = await fetch(
        `${AUTH_URL}/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email: data.email,
                password: data.password,
            }),
        }
    );

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message ||
            "Email ili lozinka nisu ispravni."
        );
    }
}

export async function getCurrentUser():
    Promise<CurrentUser | null> {
    const response = await fetch(
        `${AUTH_URL}/me`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (response.status === 401) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati korisnika."
        );
    }

    return response.json();
}

export async function logout(): Promise<void> {
    const response = await fetch(
        `${AUTH_URL}/logout`,
        {
            method: "POST",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            "Odjava nije uspjela."
        );
    }
}

async function getErrorMessage(
    response: Response
): Promise<string> {
    try {
        const data = await response.json();

        if (data.message) {
            return data.message;
        }

        if (
            Array.isArray(data.errors) &&
            data.errors.length > 0
        ) {
            return data.errors[0];
        }

        if (data.errors) {
            const messages =
                Object.values(data.errors).flat();

            if (messages.length > 0) {
                return String(messages[0]);
            }
        }

        if (data.detail) {
            return data.detail;
        }

        if (data.title) {
            return data.title;
        }
    } catch {
        // Odgovor nije JSON.
    }

    return "";
}