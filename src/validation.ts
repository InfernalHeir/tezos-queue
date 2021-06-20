import { checkSchema } from "express-validator";

export const transferRouteValidation = checkSchema({
   sender: {
      isString: true,
      notEmpty: true,
   },
   receiver: {
      isString: true,
      notEmpty: true,
   },
   amount: {
      isString: true,
      notEmpty: true,
   },
   tokenId: {
      isString: true,
      notEmpty: true,
   },
   priority: {
      isString: true,
      notEmpty: true,
   },
});
