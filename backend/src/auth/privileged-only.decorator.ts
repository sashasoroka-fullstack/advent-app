import { SetMetadata } from '@nestjs/common';

export const IS_PRIVILEGED_ONLY_KEY = 'isPrivilegedOnly';

export const PrivilegedOnly = () => SetMetadata(IS_PRIVILEGED_ONLY_KEY, true);
