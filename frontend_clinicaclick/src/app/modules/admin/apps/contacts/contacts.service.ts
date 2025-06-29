import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Contact } from 'app/modules/admin/apps/contacts/contacts.types';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { CreateUserResponse } from 'app/modules/admin/apps/contacts/contacts.types'; 
import { Clinica } from 'app/modules/admin/apps/clinicas/clinicas.types';
import { environment } from 'environments/environment';

@Injectable({providedIn: 'root'})
export class ContactsService
{
    // URL base del API de usuario
      private baseUrl = `${environment.apiUrl}/pacientes`;

    // Private
    private _contacts = new BehaviorSubject<Contact[]>([]);
    private _contact = new BehaviorSubject<Contact | null>(null);
   
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for contact
     */
    get contact$(): Observable<Contact>
    {
        return this._contact.asObservable();
    }

    /**
     * Getter for contacts
     */
    get contacts$(): Observable<Contact[]>
    {
        return this._contacts.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get contacts
     */
    getContacts(): Observable<Contact[]>
    {
        return this._httpClient.get<Contact[]>(`${this.baseUrl}`).pipe(
            tap((contacts) =>
            {
                this._contacts.next(contacts);
            }),
        );
    }

     /**
     * Search contacts with given query
     *
     * @param query
     */
     searchContacts(query: string): Observable<Contact[]> {
        return this._httpClient.get<Contact[]>(`${this.baseUrl}/search`, { params: { query } }).pipe(
            tap((contacts) => {
                this._contacts.next(contacts);
            }),
        );
    }

    /**
     * Get contact by id
     */
    getContactById(id_usuario: string): Observable<Contact>
    {
        return this._httpClient.get<Contact>(`${this.baseUrl}/${id_usuario}`).pipe(
            tap((contact) => {
                this._contact.next(contact);
            })
        );
    }

    /**
     * Create contact
     */
    createContact(contact: Contact = {
        id_usuario: '',
        avatar: null,
        nombre: 'Nuevo Usuario',
        email_usuario: '',
        fecha_creacion: new Date(),
        password_usuario: ''
    }): Observable<CreateUserResponse> {
        return this._httpClient.post<CreateUserResponse>(`${this.baseUrl}`, contact).pipe(
            tap(response => {
                if (response && response.user) {
                    const currentContacts = this._contacts.getValue();
                    this._contacts.next([...currentContacts, response.user]); // Añade el nuevo contacto a la lista actual
                }
            })
        );
    }
    
    /**
     * Update contact
     */
    updateContact(id_usuario: string, contact: Contact): Observable<Contact> {
        return this._httpClient.patch<{message: string, user: Contact}>(`${this.baseUrl}/${id_usuario}`, contact).pipe(
            tap((response) => {
                const updatedContact = response.user;
                const contacts = this._contacts.getValue() || [];
                const index = contacts.findIndex(item => item.id_usuario === id_usuario);
                contacts[index] = updatedContact;
                this._contacts.next(contacts);
                this._contact.next(updatedContact);
            }),
            map(response => response.user)
        );
    }

    /**
     * Delete the contact
     */
    deleteContact(id_usuario: string): Observable<boolean>
    {
        return this._httpClient.delete<boolean>(`${this.baseUrl}/${id_usuario}`).pipe(
            map((isDeleted) => {
                if (isDeleted) {
                    const contacts = this._contacts.getValue() || [];
                    const index = contacts.findIndex(item => item.id_usuario === id_usuario);
                    contacts.splice(index, 1);
                    this._contacts.next(contacts);
                    this._contact.next(null);
                }
                return isDeleted;
            })
        );
    }

    /**
     * Update the avatar of the given contact
     *
     * @param id_usuario
     * @param avatar
     */
    uploadAvatar(id_usuario: string, avatar: File): Observable<Contact> {
        const formData = new FormData();
        formData.append('avatar', avatar);
    
        return this._httpClient.post<Contact>(`${this.baseUrl}/${id_usuario}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }).pipe(
            tap((updatedContact) => {
                const contacts = this._contacts.getValue() || [];
                const index = contacts.findIndex(item => item.id_usuario === id_usuario);
                contacts[index] = updatedContact;
                this._contacts.next(contacts);
                this._contact.next(updatedContact);
            })
        );
    }

    /**
     * Obtener todas las clínicas
     */
    getClinicas(): Observable<Clinica[]>
    {
        return this._httpClient.get<Clinica[]>('${environment.apiUrl}/clinicas').pipe(
            tap((clinicas) => {
                // Aquí puedes realizar alguna acción si es necesario
            })
        );
    }

    /**
     * Obtener clínicas por usuario
     */
    getClinicasByUser(id_usuario: string): Observable<Clinica[]>
    {
        return this._httpClient.get<Clinica[]>(`${this.baseUrl}/${id_usuario}/clinicas`).pipe(
            tap((clinicas) => {
                // Aquí puedes realizar alguna acción si es necesario
            })
        );
    }
}
