import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { Repository } from "typeorm"
import { User, UserStatus } from "src/user/entities/user.entity"
import { JwtPayload } from "jsonwebtoken"
import { InjectRepository } from "@nestjs/typeorm"


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Account is not active")
    }

    if (user.isLocked) {
      throw new UnauthorizedException("Account is temporarily locked")
    }

    return user
  }
}
