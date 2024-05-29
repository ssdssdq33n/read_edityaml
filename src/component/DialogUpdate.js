"use client";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";

export default function DialogUpdate(props) {
  const {
    setVisible,
    visible,
    valueC,
    valueJava,
    setValueC,
    setValueJava,
    handleSubmit,
    handleSubmitMore,
    disable,
    setDisable,
    text,
  } = props;
  const footer = (
    <div className="flex justify-content-center">
      <div className="flex w-8 justify-content-between">
        <Button
          disabled={disable}
          label="OK"
          onClick={text === "One" ? handleSubmit : handleSubmitMore}
          className="w-5"
        />
        <Button
          label="Close"
          onClick={() => {
            if (!visible) return;
            setVisible(false);
            setDisable(true);
          }}
          severity="danger"
          className="w-5"
        />
      </div>
    </div>
  );
  return (
    <div>
      <Dialog
        header="Edit information"
        footer={footer}
        visible={visible}
        style={{ width: "30vw" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          setDisable(true);
        }}
      >
        <div>
          <InputText
            type="number"
            placeholder=" Java Weight"
            className="w-full"
            value={valueJava === null ? undefined : valueJava}
            onChange={(e) => {
              setValueJava(e.target.value);
              if (e.target.value === valueJava) {
                setDisable(true);
              } else {
                setDisable(false);
              }
              if (e.target.value !== "") {
                setValueC((100 - Number.parseFloat(e.target.value)).toString());
              } else {
                setValueC("");
              }
            }}
          />
          <InputText
            type="number"
            placeholder=" C# Weight"
            className="w-full mt-4"
            value={valueC === null ? undefined : valueC}
            onChange={(e) => {
              if (e.target.value === valueC) {
                setDisable(true);
              } else {
                setDisable(false);
              }
              setValueC(e.target.value);
              if (e.target.value !== "") {
                setValueJava(
                  (100 - Number.parseFloat(e.target.value)).toString()
                );
              } else {
                setValueJava("");
              }
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}
