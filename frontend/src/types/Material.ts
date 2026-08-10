export type MaterialFile = {
    id: number;
    originalFileName: string;
    contentType: string;
    fileSize: number;
};

export type Material = {
    id: number;
    title: string;
    subject: string;
    type: string;
    author: string;
    pages: number;
    description: string;
    files: MaterialFile[];
};