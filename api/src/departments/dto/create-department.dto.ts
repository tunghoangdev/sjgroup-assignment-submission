import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'IT', description: 'Department code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Information Technology', description: 'Department name' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
