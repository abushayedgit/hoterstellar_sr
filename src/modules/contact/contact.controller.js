import {
  createContact,
  listContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
} from "./contact.service.js";

export const createContactController = async (req, res, next) => {
  try {
    const contactData = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const userAgent = req.headers["user-agent"];
    const referrer = req.headers["referer"] || req.headers["referrer"] || "";

    const contact = await createContact(contactData, ip, userAgent, referrer);

    return res.status(201).json({
      success: true,
      statusCode: 201,
      code: "CREATED",
      message: "Contact form submitted",
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

export const listContactsController = async (req, res, next) => {
  try {
    const result = await listContacts(req.query);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Contacts retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getContactController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await getContactById(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Contact retrieved",
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await updateContactStatus(id, status);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Contact status updated",
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContactController = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteContact(id);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      code: "OK",
      message: "Contact deleted",
    });
  } catch (error) {
    next(error);
  }
};
