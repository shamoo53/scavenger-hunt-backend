// src/starknet-quiz/dto/create-starknet-quiz.dto.ts

import {
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isCorrectAnswerInOptions', async: false })
export class IsCorrectAnswerInOptionsConstraint
  implements ValidatorConstraintInterface
{
  validate(correctAnswer: string, args: ValidationArguments) {
    const object = args.object as CreateStarknetQuizDto;
    return object.options && object.options.includes(correctAnswer);
  }

  defaultMessage(args: ValidationArguments) {
    return 'The correct answer must be one of the provided options.';
  }
}

export class CreateStarknetQuizDto {
  @IsString()
  @IsNotEmpty()
  readonly question: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'There must be at least two options.' })
  @IsString({ each: true })
  readonly options: string[];

  @IsString()
  @IsNotEmpty()
  @Validate(IsCorrectAnswerInOptionsConstraint)
  readonly correctAnswer: string;
}