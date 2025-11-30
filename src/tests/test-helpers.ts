import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/document";
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "test-password-123";
export async function authenticateTestUser() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
    });
    if (error) {
        throw new Error(`Failed to authenticate test user: ${error.message}`);
    }
    return data;
}
export async function signOutTestUser() {
    const supabase = createClient();
    await supabase.auth.signOut();
}
export async function createTestDocument(filename = "test-document.pdf"): Promise<string> {
    const supabase = createClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
        throw new Error("User must be authenticated to create test document");
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
        const session = await supabase.auth.getSession();
        if (session.data.session?.access_token) {
            const formData = new FormData();
            const fileContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
            const file = new File([fileContent], filename, { type: "application/pdf" });
            formData.append("file", file);
            const response = await fetch(`${API_URL}/api/documents`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.data.session.access_token}`,
                },
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                return data.id;
            }
        }
    }
    catch {
    }
    throw new Error("Cannot create test document: API is not available. " +
        "Please ensure the API is running at " + API_URL + " or use the API to create documents.");
}
export async function deleteTestDocument(documentId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
    if (error) {
        throw new Error(`Failed to delete test document: ${error.message}`);
    }
}
export async function cleanupTestDocuments() {
    const supabase = createClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return;
    await supabase
        .from("documents")
        .delete()
        .eq("user_id", user.id)
        .like("filename", "test-%");
}
export function isTestEnvironmentConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        TEST_USER_EMAIL &&
        TEST_USER_PASSWORD);
}
export async function isApiAvailable(): Promise<boolean> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(2000),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
export function createTestPdfFile(filename = "test-document.pdf"): File {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
400
%%EOF`;
    return new File([pdfContent], filename, { type: "application/pdf" });
}
