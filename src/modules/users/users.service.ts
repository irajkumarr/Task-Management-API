import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthProvider, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const newUser = this.userRepository.create(createUserDto);
      await this.userRepository.save(newUser);
      return newUser;
    } catch (error: any) {
      // Postgres duplicate key error
      if (error.code === '23505') {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async createGoogleUser(data: { email: string; fullName: string }) {
    const user = this.userRepository.create({
      fullName: data.fullName,
      email: data.email,
      isEmailVerified: true,
      provider: AuthProvider.GOOGLE,
    });

    return await this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        password: true,
        phone: true,
        provider: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
      },
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: string) {
    return await this.getById(id);
  }

  async getById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, payload: Partial<User>) {
    await this.userRepository.update(id, payload);
    return this.getById(id);
  }

  async remove(id: string) {
    const user = await this.getById(id);
    return await this.userRepository.softRemove(user);
  }

  async verifyEmail(email: string, token: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verificationToken !== token) {
      return false;
    }

    if (
      user.verificationTokenExpiry &&
      user.verificationTokenExpiry < new Date()
    ) {
      return false;
    }

    await this.update(user.id, {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    return true;
  }
}
