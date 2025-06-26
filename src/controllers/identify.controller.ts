import { Request, Response } from "express"
import { ContactService } from "../services/contact.service"

export const identifyController = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Either email or phoneNumber must be provided" })
  }

  const contactService = new ContactService()

  const existingContacts = await contactService.findContactsByEmailOrPhone(email, phoneNumber)

  if (existingContacts.length === 0) {
    const newContact = await contactService.createContact(email, phoneNumber, undefined, "primary")
    return res.json({
      contact: {
        primaryContatctId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    })
  }

  const allLinked = await contactService.findAllLinkedContacts(existingContacts.map(c => c.id))

  const hasExactMatch = allLinked.some(c => c.email === email && c.phoneNumber === phoneNumber)
  const hasNewInfo =
    (email && !allLinked.some(c => c.email === email)) ||
    (phoneNumber && !allLinked.some(c => c.phoneNumber === phoneNumber))

  if (!hasExactMatch && hasNewInfo) {
    const primary = allLinked
      .filter(c => c.linkPrecedence === "primary")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

    const newSecondary = await contactService.createContact(email, phoneNumber, primary.id, "secondary")
    allLinked.push(newSecondary)
  }

  const primaries = allLinked.filter(c => c.linkPrecedence === "primary")
  if (primaries.length > 1) {
    const [truePrimary, ...toUpdate] = primaries.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    for (const contact of toUpdate) {
      await contactService.updateContactToSecondary(contact.id, truePrimary.id)
      await contactService.updateAllSecondaryContacts(contact.id, truePrimary.id)
      contact.linkedId = truePrimary.id
      contact.linkPrecedence = "secondary"
    }
  }

  const consolidated = contactService.consolidateContacts(allLinked)
  return res.json({
    contact: {
      primaryContatctId: consolidated.primaryContactId,
      emails: consolidated.emails,
      phoneNumbers: consolidated.phoneNumbers,
      secondaryContactIds: consolidated.secondaryContactIds,
    },
  })
}
