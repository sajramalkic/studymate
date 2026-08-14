import type { Material } from "../types/Material";

const API_URL = "http://localhost:5132/api/materials";

export async function getMaterials(): Promise<Material[]> {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati materijale."
        );
    }

    return response.json();
}

export async function getMaterialById(
    id: number
): Promise<Material> {
    const response = await fetch(
        `${API_URL}/${id}`
    );

    if (!response.ok) {
        throw new Error(
            "Materijal nije pronađen."
        );
    }

    return response.json();
}

export type CreateMaterialRequest = {
    title: string;
    subject: string;
    type: string;
    author: string;
    pages: number;
    description: string;
    files: File[];
};

export async function createMaterial(
    material: CreateMaterialRequest
): Promise<Material> {
    const formData = new FormData();

    formData.append(
        "title",
        material.title
    );

    formData.append(
        "subject",
        material.subject
    );

    formData.append(
        "type",
        material.type
    );

    formData.append(
        "author",
        material.author
    );

    formData.append(
        "pages",
        material.pages.toString()
    );

    formData.append(
        "description",
        material.description
    );

    material.files.forEach((file) => {
        formData.append(
            "files",
            file
        );
    });

    const response = await fetch(
        API_URL,
        {
            method: "POST",
            credentials: "include",
            body: formData,
        }
    );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message ||
            "Nije moguće dodati materijal."
        );
    }

    return response.json();
}

export async function getMyMaterials():
    Promise<Material[]> {
    const response = await fetch(
        `${API_URL}/mine`,
        {
            credentials: "include",
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi vidjela svoje materijale."
        );
    }

    if (!response.ok) {
        throw new Error(
            "Nije moguće učitati tvoje materijale."
        );
    }

    return response.json();
}

export async function deleteMaterial(
    id: number
): Promise<void> {
    const response = await fetch(
        `${API_URL}/${id}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi obrisala materijal."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Nemaš dozvolu za brisanje ovog materijala."
        );
    }

    if (response.status === 404) {
        throw new Error(
            "Materijal nije pronađen."
        );
    }

    if (!response.ok) {
        throw new Error(
            "Nije moguće obrisati materijal."
        );
    }
}

export type UpdateMaterialRequest = {
    title: string;
    subject: string;
    type: string;
    pages: number;
    author: string;
    description: string;
};

export async function updateMaterial(
    id: number,
    material: UpdateMaterialRequest
): Promise<Material> {
    const response = await fetch(
        `${API_URL}/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(
                material
            ),
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi uredila materijal."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Nemaš dozvolu za uređivanje ovog materijala."
        );
    }

    if (response.status === 404) {
        throw new Error(
            "Materijal nije pronađen."
        );
    }

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message ||
            "Nije moguće urediti materijal."
        );
    }

    return response.json();
}

export async function addMaterialFiles(
    materialId: number,
    files: File[]
): Promise<Material> {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append(
            "files",
            file
        );
    });

    const response = await fetch(
        `${API_URL}/${materialId}/files`,
        {
            method: "POST",
            credentials: "include",
            body: formData,
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi dodala fajlove."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Nemaš dozvolu za izmjenu ovog materijala."
        );
    }

    if (response.status === 404) {
        throw new Error(
            "Materijal nije pronađen."
        );
    }

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message ||
            "Nije moguće dodati fajlove."
        );
    }

    return response.json();
}

export async function deleteMaterialFile(
    materialId: number,
    fileId: number
): Promise<void> {
    const response = await fetch(
        `${API_URL}/${materialId}/files/${fileId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi uklonila fajl."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Nemaš dozvolu za izmjenu ovog materijala."
        );
    }

    if (response.status === 404) {
        throw new Error(
            "Fajl nije pronađen."
        );
    }

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(
            message ||
            "Nije moguće ukloniti fajl."
        );
    }
}