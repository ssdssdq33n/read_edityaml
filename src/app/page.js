"use client";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import YAML from "yaml";
import { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import DialogUpdate from "@/component/DialogUpdate";
import { Dialog } from "primereact/dialog";
export default function Home() {
  const [products, setProducts] = useState([]);
  const [data, setData] = useState({});
  const [renderData, setRenderData] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [visible, setVisible] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [valueJava, setValueJava] = useState(0);
  const [valueC, setValueC] = useState(0);
  const [text, setText] = useState();
  const [file, setFile] = useState(null);
  const [disable, setDisable] = useState(true);
  const [name, setName] = useState("");
  const [checkEpay, setCheck] = useState(false);
  const [defautValues, setDefaultValues] = useState();
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  let vs = null;
  let fileUploaderRef = null;
  const toast = useRef(null);
  useEffect(() => {
    // console.log(products);
    setProducts([...products]);
  }, [!renderData]);
  useEffect(() => {
    let arr = [];
    selectedProducts.forEach((item) => {
      arr.push(item["api"]);
    });
    if (arr.includes("toDomain:Epay")) {
      setCheck(true);
    } else {
      setCheck(false);
    }
  }, [selectedProducts.length]);
  function readYamlFile(e) {
    // document.getElementById("output").textContent = e.target.result;
    vs = YAML.parse(e.target.result);
    setFile(YAML.parse(e.target.result));
    let http = vs.spec.http;
    // todo: http.length
    let arr = [];
    http.forEach(function (value, index, array) {
      let pos = "corsPolicy:" + index;
      let match = value.match;
      let merged = match.length > 1;
      if (match.length > 1) {
        merged = true;
      }

      let weightC = null;
      let weightJ = null;
      let domain = null;

      let route = value.route;
      if (route < 1 || route > 3) {
        //TODO warning
      } else {
        let host1 = route[0].destination.host;
        let weight1 = route[0].weight;
        let host2 = "";
        let weight2 = null;
        if (weight1 == undefined) {
          weight1 = -100;
        }

        if (route.length == 2) {
          host2 = route[1].destination.host;
          weight2 = route[1].weight;
          if (weight2 == undefined) {
            weight2 = -100;
          }
        }

        if (host1.endsWith(".ewallet-gateway.svc.cluster.local")) {
          domain = host1.replace(".ewallet-gateway.svc.cluster.local", "");
          weightJ = weight1;
        } else if (host2.endsWith(".ewallet-gateway.svc.cluster.local")) {
          domain = host2.replace(".ewallet-gateway.svc.cluster.local", "");
          weightJ = weight2;
        }

        if (host1 === "ewallet-epay-new.sacombank.local") {
          weightC = weight1;
        } else if (host2 === "ewallet-epay-new.sacombank.local") {
          weightC = weight2;
        }
      }

      match.forEach(function (valueMatch, indexMatch, arrayMatch) {
        let reqFunc = valueMatch.headers["request-func"];
        let toDomain = valueMatch.headers.toDomain;
        let apiName = "[not found]";
        if (reqFunc != undefined) {
          apiName = reqFunc.exact;
        } else if (toDomain != undefined) {
          apiName = "toDomain:" + toDomain.exact;
        }

        if (apiName == undefined) {
          console.log();
        }

        let rowData = {
          ordNumber: index,
          position: pos,
          api: apiName,
          domain: domain,
          javaWeight: weightJ,
          csWeight: weightC,
          merged: merged,
        };
        arr.push(rowData);
      });
    });
    setProducts(arr);
    console.log();
  }
  const updateBodyTemplate = (rowData) => {
    return (
      <>
        <Button
          icon="pi pi-pencil"
          label="Edit"
          onClick={() => {
            if (rowData["api"] === "toDomain:Epay") {
              toast.current.show({
                severity: "warn",
                summary: "Warning",
                detail: "This section cannot be edited !",
                life: 3000,
              });
            } else {
              setData(rowData);
              setVisible(true);
              setValueC(rowData["csWeight"]);
              setValueJava(rowData["javaWeight"]);
              setText("One");
              setName(rowData["api"]);
              setDefaultValues({
                value1: rowData["javaWeight"],
                value2: rowData["csWeight"],
              });
            }
          }}
          severity="info"
        />
      </>
    );
  };
  const handleSubmit = () => {
    let obj = [];
    let http = file.spec.http;
    http.forEach((value, index, array) => {
      let match = value.match;
      match.forEach((valueMatch, indexMatch, arrayMatch) => {
        let reqFunc = valueMatch.headers["request-func"];
        let reqToDomain = valueMatch.headers.toDomain;
        if (reqFunc !== undefined && reqToDomain === undefined) {
          if (reqFunc["exact"] === data["api"]) {
            arrayMatch.forEach((item) => {
              products.forEach((product) => {
                if (
                  item.headers["request-func"]["exact"] !== undefined &&
                  product["api"] === item.headers["request-func"]["exact"]
                ) {
                  product["javaWeight"] =
                    valueJava === "" ? undefined : Number.parseFloat(valueJava);
                  product["csWeight"] =
                    valueC === "" ? undefined : Number.parseFloat(valueC);
                  setRenderData(!renderData);
                  setVisible(false);
                  setDisable(true);
                  setSelectedProducts([]);
                }
              });
            });
            let domain = "";
            if (
              value.route[0].destination.host.endsWith(
                ".ewallet-gateway.svc.cluster.local"
              )
            ) {
              domain = value.route[0].destination.host.replace(
                ".ewallet-gateway.svc.cluster.local",
                ""
              );
            } else if (
              value.route[1].destination.host.endsWith(
                ".ewallet-gateway.svc.cluster.local"
              )
            ) {
              domain = value.route[1].destination.host.replace(
                ".ewallet-gateway.svc.cluster.local",
                ""
              );
            }

            obj = [
              {
                destination: {
                  host: "ewallet-epay-new.sacombank.local",
                  port: { number: 80 },
                },
                weight: valueC === "" ? undefined : Number.parseFloat(valueC),
              },
              {
                destination: {
                  host: domain + ".ewallet-gateway.svc.cluster.local",
                  port: { number: 8080 },
                },
                weight:
                  valueJava === "" ? undefined : Number.parseFloat(valueJava),
              },
            ];
            value.route = obj;
            toast.current.show({
              severity: "success",
              summary: "Success",
              detail: "Edit Successed !",
              life: 3000,
            });
          }
        }
      });
    });
  };
  const handleSubmitMore = () => {
    let obj = [];
    let http = file.spec.http;
    http.forEach((value, index, array) => {
      let match = value.match;
      match.forEach((valueMatch, indexMatch, arrayMatch) => {
        let reqFunc = valueMatch.headers["request-func"];
        let reqToDomain = valueMatch.headers.toDomain;
        if (reqFunc !== undefined && reqToDomain === undefined) {
          selectedProducts.forEach((item) => {
            if (reqFunc["exact"] === item["api"]) {
              arrayMatch.forEach((item) => {
                products.forEach((product) => {
                  if (
                    item.headers["request-func"]["exact"] !== undefined &&
                    item.headers["request-func"]["exact"] === product["api"]
                  ) {
                    product["javaWeight"] =
                      valueJava === ""
                        ? undefined
                        : Number.parseFloat(valueJava);
                    product["csWeight"] =
                      valueC === "" ? undefined : Number.parseFloat(valueC);
                    setRenderData(!renderData);
                    setSelectedProducts([]);
                    setVisible(false);
                    setDisable(true);
                  }
                });
              });
              let domain = "";
              if (
                value.route[0].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[0].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              } else if (
                value.route[1].destination.host.endsWith(
                  ".ewallet-gateway.svc.cluster.local"
                )
              ) {
                domain = value.route[1].destination.host.replace(
                  ".ewallet-gateway.svc.cluster.local",
                  ""
                );
              }
              obj = [
                {
                  destination: {
                    host: "ewallet-epay-new.sacombank.local",
                    port: { number: 80 },
                  },
                  weight: valueC === "" ? undefined : Number.parseFloat(valueC),
                },
                {
                  destination: {
                    host: domain + ".ewallet-gateway.svc.cluster.local",
                    port: { number: 8080 },
                  },
                  weight:
                    valueJava === "" ? undefined : Number.parseFloat(valueJava),
                },
              ];
              value.route = obj;
            }
          });
        }
      });
    });
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Edit Successed !",
      life: 3000,
    });
  };
  const handleExport = () => {
    if (file === null && products.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "There are no files to export !",
        life: 3000,
      });
    } else {
      let blob = new Blob([YAML.stringify(file, 10)], {
        type: "application/x-yaml",
      });
      let url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("download", file.metadata.name + ".yaml");
      link.href = url;
      link.click();
    }
  };
  const bodyPosition = (rowData) => {
    return <p className="text-sm">{rowData["position"]}</p>;
  };
  const bodyApi = (rowData) => {
    return <p className="text-sm">{rowData["api"]}</p>;
  };
  const bodyDomain = (rowData) => {
    return <p className="text-sm">{rowData["domain"]}</p>;
  };
  const bodyJava = (rowData) => {
    return <p className="text-sm">{rowData["javaWeight"]}</p>;
  };
  const bodyC = (rowData) => {
    return <p className="text-sm">{rowData["csWeight"]}</p>;
  };
  return (
    <div className="w-full flex justify-content-center align-items-center">
      <Toast ref={toast} />
      <div className="w-11">
        <div className="w-full flex justify-content-between align-items-center mt-5">
          <div className="flex align-items-center">
            <FileUpload
              ref={(ref) => {
                fileUploaderRef = ref;
              }}
              name="inputfile"
              id="inputfile"
              mode="basic"
              accept=".yaml,.yml,.txt"
              onSelect={(e) => {
                console.log(e.files[0]["name"].split(".")[1]);
                if (
                  e.files[0]["name"].split(".")[1] === "yaml" ||
                  e.files[0]["name"].split(".")[1] === "yml" ||
                  e.files[0]["name"].split(".")[1] === "text"
                ) {
                  let fr = new FileReader();
                  fr.onload = readYamlFile;
                  fr.readAsText(e.files[0]);
                } else {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Incorrect .yaml format !",
                    life: 3000,
                  });
                  fileUploaderRef.clear();
                }
              }}
            />
            <Button
              label="Export"
              className="ml-3"
              severity="secondary"
              icon="pi pi-download"
              onClick={handleExport}
            />
          </div>
          <div className="flex align-items-center">
            <Button
              disabled={file === null ? true : false}
              label="Yaml text"
              icon="pi pi-book"
              className="mr-3"
              severity="help"
              onClick={() => {
                setVisible2(true);
              }}
            />
            <Button
              icon="pi pi-pencil"
              badge={
                selectedProducts.length === 0 ? false : selectedProducts.length
              }
              label="Edit"
              disabled={selectedProducts.length > 0 ? false : true}
              onClick={() => {
                if (selectedProducts.length > 0) {
                  if (checkEpay === true) {
                    toast.current.show({
                      severity: "warn",
                      summary: "Warning",
                      detail: "Epay cannot be edited !",
                      life: 3000,
                    });
                  } else {
                    setVisible(true);
                    setValueC(null);
                    setValueJava(null);
                    setText("More");
                    setName(`${selectedProducts.length}`);
                    setDefaultValues({
                      value1: "",
                      value2: "",
                    });
                  }
                } else {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "There are no boxes selected !",
                    life: 3000,
                  });
                }
              }}
              severity="info"
              className=""
            />
          </div>
        </div>
        <div className="mt-4 w-full flex justify-content-between border-500 surface-200 border-1 border-round p-5">
          <div className="w-full">
            <span className="p-input-icon-right">
              <InputText
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    global: {
                      value: e.target.value,
                      matchMode: FilterMatchMode.CONTAINS,
                    },
                  })
                }
                id="name"
                placeholder="...Search"
                className="w-full h-full border-1"
              />
            </span>
            <DataTable
              paginator
              filters={filters}
              rows={20}
              rowsPerPageOptions={[20, 50, 100, 150, 200]}
              value={products}
              selectionMode={true}
              selection={selectedProducts}
              onSelectionChange={(e) => setSelectedProducts(e.value)}
              dataKey="api"
              className="w-full my-4"
              tableStyle={{ minWidth: "50rem" }}
            >
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3rem" }}
              ></Column>
              <Column
                field="position"
                body={bodyPosition}
                header="Position"
              ></Column>
              <Column field="api" body={bodyApi} header="API"></Column>
              <Column field="domain" body={bodyDomain} header="Domain"></Column>
              <Column field="javaWeight" body={bodyJava} header="Java"></Column>
              <Column field="csWeight" body={bodyC} header="C#"></Column>
              <Column field="merged" header="Merged"></Column>
              <Column className="" body={updateBodyTemplate}></Column>
            </DataTable>
          </div>
        </div>
        {/* <pre className="line-numbers">
          <code id="output" className="language-yaml"></code>
        </pre> */}
      </div>
      <DialogUpdate
        visible={visible}
        setVisible={setVisible}
        valueJava={valueJava}
        setValueJava={setValueJava}
        valueC={valueC}
        setValueC={setValueC}
        handleSubmit={handleSubmit}
        handleSubmitMore={handleSubmitMore}
        disable={disable}
        setDisable={setDisable}
        text={text}
        name={name}
        defautValues={defautValues}
      />
      <Dialog
        header={() => {
          return <h4 className="flex justify-content-center">Yaml Text</h4>;
        }}
        visible={visible2}
        onHide={() => {
          if (!visible2) return;
          setVisible2(false);
        }}
      >
        {file !== null && (
          <pre className="line-numbers">
            <code id="output" className="language-yaml">
              {YAML.stringify(file, 10)}
            </code>
          </pre>
        )}
      </Dialog>
    </div>
  );
}
