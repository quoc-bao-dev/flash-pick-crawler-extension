import { httpController } from "../core/http/http";

export const registerExtension = async (name: string) => {
  const res = await httpController.get(`/api/v1/extension/register/${name}`);
  return res.data;
};

export const handshakeExtension = async (id: string) => {
  const res = await httpController.get(`/api/v1/extension/handshake/${id}`);
  return res.data;
};

export const getExtensionInfo = async (name: string) => {
  const res = await httpController.get(`/api/v1/extension/get-info/${name}`);
  return res.data;
};

export const unregisterExtension = async (name: string) => {
  const res = await httpController.delete(`/api/v1/extension/${name}`);
  return res.data;
};
