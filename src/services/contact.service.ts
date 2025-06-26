import { sql } from "../database/index.js"
import { Contact, ConsolidatedContact } from "../models/contact.model.js"

export class ContactService {
  async findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const conditions = []
    const params = []

    if (email) {
      conditions.push(`email = $${params.length + 1}`)
      params.push(email)
    }
    if (phoneNumber) {
      conditions.push(`"phoneNumber" = $${params.length + 1}`)
      params.push(phoneNumber)
    }

    const query = `
      SELECT * FROM "Contact"
      WHERE "deletedAt" IS NULL AND (${conditions.join(" OR ")})
      ORDER BY "createdAt" ASC
    `

    const result = await sql.query(query, params)
    return result as Contact[]
  }

  async findAllLinkedContacts(contactIds: number[]): Promise<Contact[]> {
    if (contactIds.length === 0) return []

    const placeholders = contactIds.map((_, i) => `$${i + 1}`).join(",")

    const query = `
      WITH RECURSIVE linked_contacts AS (
        SELECT * FROM "Contact"
        WHERE "deletedAt" IS NULL AND (id IN (${placeholders}) OR "linkedId" IN (${placeholders}))
        UNION
        SELECT c.* FROM "Contact" c
        INNER JOIN linked_contacts lc ON (c."linkedId" = lc.id OR c.id = lc."linkedId")
        WHERE c."deletedAt" IS NULL
      )
      SELECT DISTINCT * FROM linked_contacts
      ORDER BY "createdAt" ASC
    `
    const result = await sql.query(query, contactIds)
    return result as Contact[]
  }

  async createContact(
    email?: string,
    phoneNumber?: string,
    linkedId?: number,
    linkPrecedence: "primary" | "secondary" = "primary"
  ): Promise<Contact> {
    const result = await sql.query(
      `
      INSERT INTO "Contact" ("phoneNumber", email, "linkedId", "linkPrecedence", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [phoneNumber || null, email || null, linkedId || null, linkPrecedence]
    )
    return result[0] as Contact
  }

  async updateContactToSecondary(contactId: number, linkedId: number): Promise<Contact> {
    const result = await sql.query(
      `UPDATE "Contact" SET "linkedId" = $1, "linkPrecedence" = 'secondary', "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [linkedId, contactId]
    )
    return result[0] as Contact
  }

  async updateAllSecondaryContacts(oldPrimaryId: number, newPrimaryId: number): Promise<void> {
    await sql.query(
      `UPDATE "Contact" SET "linkedId" = $1, "updatedAt" = NOW() WHERE "linkedId" = $2`,
      [newPrimaryId, oldPrimaryId]
    )
  }

  consolidateContacts(contacts: Contact[]): ConsolidatedContact {
    const primaryContact = contacts
      .filter(c => c.linkPrecedence === "primary")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

    const secondaryContacts = contacts.filter(c => c.id !== primaryContact.id)

    const emails = Array.from(new Set(contacts.map(c => c.email).filter((e): e is string => e !== null)))
    const phoneNumbers = Array.from(new Set(contacts.map(c => c.phoneNumber).filter((p): p is string => p !== null)))

    return {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryContacts.map(c => c.id),
    }
  }
}
