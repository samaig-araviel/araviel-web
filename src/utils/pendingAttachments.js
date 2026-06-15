let pending = [];

export const setPendingAttachments = (files) => {
  pending = Array.isArray(files) ? files.filter((f) => f instanceof File) : [];
};

export const takePendingAttachments = () => {
  const out = pending;
  pending = [];
  return out;
};

export const clearPendingAttachments = () => {
  pending = [];
};
