import express from "express";
import * as z from "zod";
import { fromError } from "zod-validation-error";

const app = express();
const port = 3000;

interface Item {
  id: number;
  text: string;
  isMarked: boolean;
}

let data: Item[] = [];
let idAll = 0;

app.use(express.json());

app.get("/", (req, res) => {
  //const query = req.query;
  try {
    const validate = z.object({
      type: z.enum(["all", "marked", "unmarked"]).optional(),
    });
    const query = validate.parse(req.query);
    switch (query.type) {
      case "marked":
        return res.status(200).json({
          data: data.filter((item) => item.isMarked),
        });
      case "unmarked":
        return res.status(200).json({
          data: data.filter((item) => !item.isMarked),
        });
      case "all":
      default:
        return res.status(200).json({
          data,
        });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const validationError = fromError(error);
      return res.status(400).json({
        error: validationError.message,
      });
    } else {
      return res.status(500).json({
        error: error instanceof Error ? error.message : error,
      });
    }
  }
});

app.post("/", (req, res) => {
  try {
    const validate = z.object({
      text: z.string(),
      isMarked: z.boolean().default(false),
      position: z.number().min(0).max(data.length).default(data.length),
    });
    const input = validate.parse(req.body);
    idAll++;
    data.splice(input.position, 0, {
      id: idAll,
      text: input.text,
      isMarked: input.isMarked,
    });
    return res.status(201).json({
      data: { id : idAll, text: input.text, isMarked: input.isMarked },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const validationError = fromError(error);
      return res.status(400).json({
        error: validationError.message,
      });
    } else {
      return res.status(500).json({
        error: error instanceof Error ? error.message : error,
      });
    }
  }
});

app.put("/:id/", (req, res) => {
  try {
    const indexItem = data.findIndex(
      (item) => item.id == parseInt(req.params.id)
    );
    if (indexItem < 0) {
      return res.status(404).json({
        error: "Item not found",
      });
    }
    const item = data[indexItem];
    const validate = z.object({
      text: z.string().optional(),
      isMarked: z.boolean().optional(),
      position: z
        .number()
        .min(0)
        .max(data.length - 1)
        .optional(),
    });
    const input = validate.parse(req.body);
    // remove the old one
    data.splice(indexItem, 1);
    // (add) a new update
    data.splice("position" in input ? input.position || 0 : indexItem, 0, {
      id : item!.id,
      text: "text" in input ? input.text || item!.text : item!.text,
      isMarked:
        "isMarked" in input ? input.isMarked || item!.isMarked : item!.isMarked,
    });
    return res.status(200).json({
      data: {
        id : item!.id,
        text: input?.text || item?.text,
        isMarked: input?.isMarked || item?.isMarked,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromError(error);
      return res.status(400).json({
        error: validationError.message,
      });
    } else {
      return res.status(500).json({
        error: error instanceof Error ? error.message : error,
      });
    }
  }
});

app.delete("/:id/", (req, res) => {
  const indexItem = data.findIndex(
    (item) => item.id == parseInt(req.params.id)
  );
  if (indexItem < 0) {
    return res.status(404).json({
      error: "Item not found",
    });
  }
  data.splice(indexItem, 1);
  return res.json({ msg: "Item had been deleted." });
});

app.all("/*splat", (req, res) =>
  res.status(404).json({ errors: "Route not found." })
);

app.listen(port, () => {
  console.log(`To-Do API app listening on port ${port}`);
});
