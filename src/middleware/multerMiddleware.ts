// multer configuration

import { Request } from "express";
import multer from "multer";

// locally file store garnu vayo
const storage = multer.diskStorage({
  // location incoming file kata rakne vanne ho
  // cb - callback function
  // cb(error,success)
  destination: function (req: Request, file: any, cb: any) {
    cb(null, "./src/uploads/"); // yo location ma file rakne ho
  },
  // mathi ko location deko ma rakey paxi, k name ma rakne vanne
  filename: function (req: Request, file: any, cb: any) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

/*
1234 -- date.now() --> 1234-hello.pdf
hello.pdf ---> multer --> location(src/storage/) --> haha_hello.pdf
hello.pdf ---> multer --> location(storage) --> hello-123123.pdf

*/

export { multer, storage };
